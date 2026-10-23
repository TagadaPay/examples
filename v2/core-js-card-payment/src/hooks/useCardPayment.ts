import { useState } from 'react';
import { useCardTokenization } from '@tagadapay/core-js/react';
import { useAirwallexRadar } from '@tagadapay/core-js/react';
import { apiRequest, type PaymentInstrumentResult, type PaymentResult } from '@/lib/api';
import type { PaymentLogger } from './usePaymentLogger';
import type { CardData } from '@/components/form/CardForm';

/**
 * useCardPayment — orchestrates the full TagadaPay card payment flow.
 *
 * FLOW OVERVIEW
 * ─────────────
 * 1. Tokenize card  →  POST /api/public/v1/payment-instruments/create-from-token
 *    The card number, expiry, and CVC are sent to the TagadaPay SDK (backed by
 *    BasisTheory). Raw card data never reaches your server. The SDK returns a
 *    `tagadaToken` — a short-lived opaque token representing the card.
 *
 * 2. Create Payment Instrument (PI)  →  POST /api/public/v1/payment-instruments/create-from-token
 *    Exchange the `tagadaToken` for a reusable `paymentInstrumentId` tied to a
 *    customer record. Shipping and billing addresses are saved here so they are
 *    available for subsequent resume / continue calls (e.g. after 3DS).
 *
 * 3. Process Payment  →  POST /api/public/v1/payments/process
 *    Submit the payment. The response may be:
 *      • `requireAction: null / "none"`  →  payment succeeded immediately.
 *      • `requireAction: "radar"`        →  Airwallex Radar device fingerprinting
 *                                           required before the charge can proceed.
 *      • `requireAction: "redirect" | "threeds_auth" | "processor_auth"`
 *                                        →  3DS challenge required; redirect the
 *                                           customer to the bank authentication page.
 *
 * 4. Handle requireAction  →  handled client-side by handleRequireAction()
 *    • radar:           Collect device fingerprint silently via useAirwallexRadar,
 *                       POST the session to /radar-sessions, then POST /payments/continue
 *                       to resume the charge. The resumed payment may itself require
 *                       a 3DS redirect, so handleRequireAction recurses.
 *    • redirect / 3DS:  Build a returnUrl pointing to /return?paymentId=…, append it
 *                       to the processor's challenge URL, and surface it to the user.
 *                       In a production app you would redirect automatically.
 *                       After the customer completes the challenge they land on /return,
 *                       which polls for the final payment status.
 *
 * NOTE ON requireAction discrimination
 * ─────────────────────────────────────
 * The top-level `payment.requireAction` field may be a generic "redirect" even when
 * the underlying action type is more specific (e.g. "processor_auth"). We use
 * `requireActionData.metadata.type` as the primary discriminator when present.
 */

/**
 * Represents the current phase of the payment flow.
 *
 * idle          — no payment in progress
 * tokenizing    — SDK is encrypting the card and returning a tagadaToken
 * creating-pi   — exchanging the token for a reusable payment instrument
 * processing    — submitting the payment to the processor
 * radar         — Airwallex Radar is collecting a device fingerprint silently
 * redirect      — waiting for the user to complete a 3DS bank challenge
 * succeeded     — payment completed successfully
 * failed        — an error occurred; check `error` for details
 */
export type FlowStep =
  | 'idle'
  | 'tokenizing'
  | 'creating-pi'
  | 'processing'
  | 'radar'
  | 'redirect'
  | 'succeeded'
  | 'failed';

interface UseCardPaymentParams {
  config: {
    apiToken: string;
    storeId: string;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address1: string;
      address2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string;
      email: string;
    };
    billingAddress: {
      firstName: string;
      lastName: string;
      address1: string;
      address2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string;
      email: string;
    };
    getApiBaseUrl: () => string;
    getSdkEnvironment: () => 'production' | 'development' | 'local';
  };
  logger: PaymentLogger;
}

interface UseCardPaymentReturn {
  flowStep: FlowStep;
  piResult: PaymentInstrumentResult | null;
  payment: PaymentResult | null;
  error: string | null;
  isInitialized: boolean;
  startPayment: (card: CardData, amount: number, currency: string) => Promise<void>;
  reset: () => void;
  redirectUrl: string | null;
  pendingPaymentId: string | null;
}

function extractAcsChallengeUrl(payment: PaymentResult): string | null {
  const meta = payment.payment?.requireActionData?.metadata;
  if (!meta) return null;
  return (
    meta.threedsSession?.acsChallengeUrl ||
    (meta.acsChallengeUrl as string | undefined) ||
    null
  );
}

export function useCardPayment({ config, logger }: UseCardPaymentParams): UseCardPaymentReturn {
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [piResult, setPiResult] = useState<PaymentInstrumentResult | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const sdkEnv = config.getSdkEnvironment();

  const { tokenizeCard, isInitialized } = useCardTokenization({
    environment: sdkEnv,
    autoInitialize: true,
  });

  const { handleRadarAction } = useAirwallexRadar({
    apiClient: {
      saveRadarSession: async (data: { paymentId: string; airwallexRadarSessionId: string }) => {
        const res = await apiRequest<{ success: boolean; radarSessionId: string }>({
          method: 'POST',
          path: '/api/public/v1/radar-sessions',
          apiBaseUrl: config.getApiBaseUrl(),
          apiToken: config.apiToken,
          body: data,
        });
        return res.data;
      },
      completePaymentAfterAction: async (paymentId: string) => {
        const res = await apiRequest<Record<string, unknown>>({
          method: 'POST',
          path: '/api/public/v1/payments/continue',
          apiBaseUrl: config.getApiBaseUrl(),
          apiToken: config.apiToken,
          body: { paymentId },
        });
        return res.data as Record<string, unknown> & { status: string; requireAction?: string };
      },
    },
  });

  /**
   * Inspect the payment's `requireAction` field and drive the flow forward.
   *
   * Called after every step that may return a paused payment (initial process
   * and after Radar resume). Recurses when Radar resolves into a 3DS challenge.
   *
   * @param currentPayment  The payment response to inspect.
   * @param returnBaseUrl   Origin + path the customer should return to after 3DS
   *                        (e.g. "https://yourapp.com/return").
   */
  const handleRequireAction = async (
    currentPayment: PaymentResult,
    returnBaseUrl: string,
  ): Promise<void> => {
    const action = currentPayment.payment?.requireAction;
    const actionData = currentPayment.payment?.requireActionData;
    const meta = actionData?.metadata;
    // Use metadata.type as the more specific discriminator, fall back to requireAction
    const effectiveAction = meta?.type || action;

    if (!action || action === 'none') {
      setFlowStep('succeeded');
      return;
    }

    if (action === 'radar' && meta?.provider === 'airwallex') {
      setFlowStep('radar');
      logger.event('Airwallex Radar — collecting device fingerprint');

      try {
        const resumed = await handleRadarAction({
          paymentId: currentPayment.payment.id,
          isTest: meta.isTest ?? true,
        });

        logger.response('Radar complete — payment resumed', resumed);
        const resumedPayment = { payment: resumed } as unknown as PaymentResult;
        setPayment(resumedPayment);

        // Recurse to handle the next action (could be 3DS)
        await handleRequireAction(resumedPayment, returnBaseUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('Radar failed', msg);
        setError(msg);
        setFlowStep('failed');
      }
      return;
    }

    if (effectiveAction === 'redirect' || effectiveAction === 'threeds_auth' || effectiveAction === 'processor_auth') {
      const acs = effectiveAction === 'processor_auth'
        ? meta?.redirect?.redirectUrl as string | undefined
        : extractAcsChallengeUrl(currentPayment);
      if (!acs) {
        logger.error('3DS redirect — missing redirect URL', actionData);
        setError('Missing 3DS challenge URL in payment response');
        setFlowStep('failed');
        return;
      }

      const resumeToken = actionData?.resumeToken as string | undefined;
      const returnUrl = `${returnBaseUrl}?paymentId=${currentPayment.payment.id}${resumeToken ? `&resumeToken=${resumeToken}` : ''}`;
      const separator = acs.includes('?') ? '&' : '?';
      const finalUrl = `${acs}${separator}returnUrl=${encodeURIComponent(returnUrl)}`;

      setRedirectUrl(finalUrl);
      setPendingPaymentId(currentPayment.payment.id);
      setFlowStep('redirect');

      // In a production app you would redirect automatically (window.location.href = finalUrl).
      // This example surfaces the URL as a button so the flow is visible and inspectable.
      logger.event('3DS authentication required — awaiting user redirect', {
        redirectUrl: acs,
        returnUrl,
        resumeToken,
      });
      return;
    }

    // Unknown action — treat as failed with info
    logger.error(`Unknown requireAction: ${effectiveAction}`, actionData);
    setError(`Unhandled requireAction: ${effectiveAction}`);
    setFlowStep('failed');
  };

  const startPayment = async (card: CardData, amount: number, currency: string) => {
    if (!config.apiToken) { setError('API Token is required. Configure it in the sidebar.'); return; }
    if (!config.storeId) { setError('Store ID is required. Configure it in the sidebar.'); return; }

    setFlowStep('tokenizing');
    setPayment(null);
    setPiResult(null);
    setError(null);
    setRedirectUrl(null);
    setPendingPaymentId(null);

    const apiBaseUrl = config.getApiBaseUrl();
    const returnBaseUrl = `${window.location.origin}/return`;

    // Step 1: Tokenize
    logger.event('Step 1 — Tokenizing card');
    let tagadaToken: string;
    try {
      const tokenResult = await tokenizeCard({
        cardNumber: card.cardNumber.replace(/\s/g, ''),
        expiryDate: card.expiryDate,
        cvc: card.cvc,
        cardholderName: card.cardholderName,
      });
      tagadaToken = tokenResult.tagadaToken;
      logger.response('Card tokenized', { token: tagadaToken.slice(0, 40) + '...' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Tokenization failed', msg);
      setError(msg);
      setFlowStep('failed');
      return;
    }

    // Step 2: Create Payment Instrument
    setFlowStep('creating-pi');
    logger.request('Step 2 — POST /api/public/v1/payment-instruments/create-from-token', {
      storeId: config.storeId,
      customerEmail: config.customerEmail,
    });

    let pi: PaymentInstrumentResult;
    try {
      const piRes = await apiRequest<PaymentInstrumentResult>({
        method: 'POST',
        path: '/api/public/v1/payment-instruments/create-from-token',
        apiBaseUrl,
        apiToken: config.apiToken,
        body: {
          tagadaToken,
          storeId: config.storeId,
          customerData: {
            email: config.customerEmail,
            firstName: config.customerFirstName,
            lastName: config.customerLastName,
            shippingAddress: config.shippingAddress,
            billingAddress: config.billingAddress,
          },
        },
      });

      if (!piRes.ok) throw new Error(`HTTP ${piRes.status}: ${JSON.stringify(piRes.data)}`);
      pi = piRes.data;
      setPiResult(pi);
      logger.response(
        `PI created: ${pi.paymentInstrument.card.brand} ****${pi.paymentInstrument.card.last4}`,
        { id: pi.paymentInstrument.id },
        piRes.duration,
        piRes.status,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Create PI failed', msg);
      setError(msg);
      setFlowStep('failed');
      return;
    }

    // Step 3: Process Payment
    setFlowStep('processing');
    const requestBody = {
      amount,
      currency,
      storeId: config.storeId,
      paymentInstrumentId: pi.paymentInstrument.id,
      returnUrl: returnBaseUrl,
      shippingAddress: {
        firstName: config.shippingAddress.firstName,
        lastName: config.shippingAddress.lastName,
        address1: config.shippingAddress.address1,
        address2: config.shippingAddress.address2 || undefined,
        city: config.shippingAddress.city,
        state: config.shippingAddress.state,
        zip: config.shippingAddress.zip,
        country: config.shippingAddress.country,
        phone: config.shippingAddress.phone || undefined,
        email: config.shippingAddress.email || undefined,
      },
      billingAddress: {
        firstName: config.billingAddress.firstName,
        lastName: config.billingAddress.lastName,
        address1: config.billingAddress.address1,
        address2: config.billingAddress.address2 || undefined,
        city: config.billingAddress.city,
        state: config.billingAddress.state,
        zip: config.billingAddress.zip,
        country: config.billingAddress.country,
        phone: config.billingAddress.phone || undefined,
        email: config.billingAddress.email || undefined,
      },
    };
    logger.request('Step 3 — POST /api/public/v1/payments/process', requestBody);

    let processedPayment: PaymentResult;
    try {
      const payRes = await apiRequest<PaymentResult>({
        method: 'POST',
        path: '/api/public/v1/payments/process',
        apiBaseUrl,
        apiToken: config.apiToken,
        body: requestBody,
      });

      if (!payRes.ok) throw new Error(`HTTP ${payRes.status}: ${JSON.stringify(payRes.data)}`);
      processedPayment = payRes.data;
      setPayment(processedPayment);
      logger.response(
        `Payment ${processedPayment.payment.status}: ${processedPayment.payment.id}`,
        { status: processedPayment.payment.status, requireAction: processedPayment.payment.requireAction },
        payRes.duration,
        payRes.status,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Payment processing failed', msg);
      setError(msg);
      setFlowStep('failed');
      return;
    }

    // Step 4: Handle requireAction
    await handleRequireAction(processedPayment, returnBaseUrl);
  };

  const reset = () => {
    setFlowStep('idle');
    setPiResult(null);
    setPayment(null);
    setError(null);
    setRedirectUrl(null);
    setPendingPaymentId(null);
    logger.clear();
  };

  return {
    flowStep,
    piResult,
    payment,
    error,
    isInitialized,
    startPayment,
    reset,
    redirectUrl,
    pendingPaymentId,
  };
}
