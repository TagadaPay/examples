import { useState, useEffect } from 'react';
import { useCheckout, usePayment, useAnalytics } from '@tagadapay/headless-sdk/react';

interface Props {
  checkoutToken: string;
  onBack: () => void;
  onComplete: (paymentId: string) => void;
}

export function PaymentStep({ checkoutToken, onBack, onComplete }: Props) {
  const { session } = useCheckout(checkoutToken);
  const {
    paymentSetup,
    expressMethods,
    storeConfig,
    isProcessing,
    result,
    error,
    loadPaymentSetup,
    pay,
    tokenizeCard,
  } = usePayment();
  const { trackAddPaymentInfo, trackStep } = useAnalytics();

  const [card, setCard] = useState({ cardNumber: '', expiryDate: '', cvc: '', cardholderName: '' });
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.id) {
      loadPaymentSetup(session.id);
      trackStep({ stepName: 'payment', stepIndex: 2 });
    }
  }, [session?.id, loadPaymentSetup, trackStep]);

  useEffect(() => {
    if (result?.payment.status === 'succeeded') {
      onComplete(result.payment.id);
    }
  }, [result, onComplete]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectCardBrand = (number: string): string => {
    const n = number.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    return '';
  };

  const handlePay = async () => {
    if (!session) return;

    setPayError(null);
    trackAddPaymentInfo({ paymentMethod: 'card' });

    try {
      const { tagadaToken } = await tokenizeCard({
        cardNumber: card.cardNumber.replace(/\s/g, ''),
        expiryDate: card.expiryDate,
        cvc: card.cvc,
        cardholderName: card.cardholderName || undefined,
      });

      await pay({
        checkoutSessionId: session.id,
        tagadaToken,
      });
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const displayError = payError || (error?.message ?? null);
  const brand = detectCardBrand(card.cardNumber);

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Payment Setup Info */}
      {paymentSetup && (
        <div className="card-dark">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Available Methods</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(paymentSetup)
              .filter(([, config]) => config.enabled)
              .map(([key, config]) => (
                <div
                  key={key}
                  className="badge bg-white/5 text-white/60 border border-white/10"
                >
                  {config.logoUrl && <img src={config.logoUrl} alt="" className="h-3 w-3" />}
                  {config.label || config.method}
                </div>
              ))}
          </div>

          {expressMethods && (
            <div className="mt-3 flex flex-wrap gap-2">
              {expressMethods.applePay?.available && (
                <button className="btn-ghost flex items-center gap-2 text-xs">
                  <span></span> Apple Pay
                </button>
              )}
              {expressMethods.googlePay?.available && (
                <button className="btn-ghost flex items-center gap-2 text-xs">
                  <span>G</span> Google Pay
                </button>
              )}
            </div>
          )}

          {storeConfig?.threedsEnabled && (
            <p className="mt-3 text-[10px] text-white/25 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              3D Secure enabled for this store
            </p>
          )}
        </div>
      )}

      {/* Card Form */}
      <div className="card-dark">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30">Card Details</h3>
          {brand && (
            <span className="badge bg-white/5 text-white/50 border border-white/10 text-[10px]">
              {brand}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Card Number</label>
            <input
              type="text"
              value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
              className="input-dark font-mono tracking-widest"
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/40">Expiry</label>
              <input
                type="text"
                value={card.expiryDate}
                onChange={(e) => setCard({ ...card, expiryDate: formatExpiry(e.target.value) })}
                className="input-dark font-mono"
                placeholder="12/28"
                maxLength={5}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/40">CVC</label>
              <input
                type="text"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="input-dark font-mono"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Cardholder Name (optional)</label>
            <input
              type="text"
              value={card.cardholderName}
              onChange={(e) => setCard({ ...card, cardholderName: e.target.value })}
              className="input-dark"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Test card hint */}
        <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
          <p className="text-[10px] text-white/25">
            Test card: <code className="font-mono text-white/40">4242 4242 4242 4242</code> &middot; Any future date &middot; Any CVC
          </p>
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <div className="card-dark border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
            </svg>
            <p className="text-xs text-red-300/80">{displayError}</p>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={isProcessing || !card.cardNumber || !card.expiryDate || !card.cvc}
        className="btn-primary w-full text-center"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </span>
        ) : (
          <span>
            Pay {session ? formatAmount(session.totals.total, session.totals.currency) : ''}
            <svg className="ml-2 -mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </span>
        )}
      </button>

      {/* Back */}
      <div className="flex justify-start">
        <button onClick={onBack} className="btn-ghost text-xs">
          <svg className="mr-1.5 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Checkout
        </button>
      </div>

      {/* Hook Info */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-500/20">
            <span className="text-[10px]">{'</>'}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white/50">Hooks used on this step</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">usePayment()</code>
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useCheckout()</code>
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useAnalytics()</code>
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">
              loadPaymentSetup &middot; tokenizeCard &middot; pay &middot; trackAddPaymentInfo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
