import { useState, useEffect } from 'react';
import { useCheckout, usePayment } from '@tagadapay/headless-sdk/react';
import { CodePanel } from './CodePanel';
import { ResourceId, ResourceIdBar } from './ResourceId';

interface PaymentStepProps {
  checkoutToken: string;
  sessionToken: string;
  onBack: () => void;
  onComplete: (paymentId: string) => void;
}

export function PaymentStep({ checkoutToken, sessionToken, onBack, onComplete }: PaymentStepProps) {
  const { session } = useCheckout(checkoutToken, sessionToken);
  const { loadPaymentSetup, tokenizeCard, pay, isProcessing } = usePayment();

  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'tokenizing' | 'paying' | 'success'>('idle');

  useEffect(() => {
    if (session?.id) {
      loadPaymentSetup(session.id);
    }
  }, [loadPaymentSetup, session?.id]);

  const handlePay = async () => {
    if (!session?.id) return;
    setError(null);

    if (!card.number || !card.exp || !card.cvc || !card.name) {
      setError('Please fill in all card fields');
      return;
    }

    try {
      setStatus('tokenizing');

      const expiryDate = card.exp.replace(/\s/g, '');

      const { tagadaToken } = await tokenizeCard({
        cardNumber: card.number.replace(/\s/g, ''),
        expiryDate,
        cvc: card.cvc,
        cardholderName: card.name,
      });

      setStatus('paying');
      const result = await pay({
        checkoutSessionId: session.id,
        tagadaToken,
      });

      const paymentStatus = result.payment.status;
      const paymentId = result.payment.id;

      if (paymentStatus === 'succeeded') {
        setStatus('success');
        setTimeout(() => onComplete(paymentId), 800);
      } else if (paymentStatus === 'requires_action') {
        setError('3D Secure authentication required. This demo does not handle 3DS redirects.');
        setStatus('idle');
      } else {
        setError(`Payment status: ${paymentStatus}`);
        setStatus('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStatus('idle');
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExp = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    return digits;
  };

  const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20';

  return (
    <div className="space-y-4 animate-fade-in">
      <ResourceIdBar>
        <ResourceId label="checkoutToken" value={checkoutToken} />
        {session?.id && <ResourceId label="sessionId" value={session.id} />}
      </ResourceIdBar>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Payment</h2>
        <button onClick={onBack} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
          &larr; Back to Checkout
        </button>
      </div>

      {/* Total */}
      {session?.totals && (
        <div className="card-dark px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Total to pay</span>
            <span className="text-xl font-bold text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: session.totals.currency,
              }).format(session.totals.total / 100)}
            </span>
          </div>
        </div>
      )}

      {/* Card form */}
      <div className="card-dark space-y-4 px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Cardholder Name</label>
          <input
            type="text"
            value={card.name}
            onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
            placeholder="John Doe"
            className={inputClass.replace('font-mono ', '')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Card Number</label>
          <input
            type="text"
            value={card.number}
            onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
            placeholder="4242 4242 4242 4242"
            className={inputClass}
            maxLength={19}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Expiry</label>
            <input
              type="text"
              value={card.exp}
              onChange={(e) => setCard((c) => ({ ...c, exp: formatExp(e.target.value) }))}
              placeholder="MM / YY"
              className={inputClass}
              maxLength={7}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">CVC</label>
            <input
              type="text"
              value={card.cvc}
              onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="123"
              className={inputClass}
              maxLength={4}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={isProcessing || status === 'tokenizing' || status === 'paying' || status === 'success'}
          className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
        >
          {status === 'tokenizing' && (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tokenizing card...
            </span>
          )}
          {status === 'paying' && (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing payment...
            </span>
          )}
          {status === 'success' && (
            <span className="flex items-center justify-center gap-2 text-green-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Payment Successful!
            </span>
          )}
          {status === 'idle' && 'Pay Now'}
        </button>
      </div>

      <p className="text-center text-xs text-white/20">
        Payments are processed securely by TagadaPay. Card data is tokenized and never stored.
      </p>

      {/* Test card hint */}
      <div className="rounded-xl border border-brand-500/10 bg-brand-500/[0.03] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div>
            <p className="text-xs font-medium text-brand-300">Test Cards for Sandbox</p>
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-brand-300/80">4242 4242 4242 4242</code>
                <span className="text-white/25">—</span>
                <span>Visa (always succeeds)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-brand-300/80">4000 0000 0000 3220</code>
                <span className="text-white/25">—</span>
                <span>3D Secure required</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-brand-300/80">4000 0000 0000 0002</code>
                <span className="text-white/25">—</span>
                <span>Card declined</span>
              </div>
              <p className="mt-1 text-[11px] text-white/30">Use any future expiry (e.g. 12/28) and any 3-digit CVC.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <CodePanel
          title="Backend — Payment Flow & PSP Orchestration"
          hookName="node-sdk"
          variant="backend"
          code={`import Tagada from '@tagadapay/node-sdk';
const tagada = new Tagada('tgd_your_api_key');

// 1. Create a processor (Stripe, sandbox, etc.)
const { processor } = await tagada.processors.create({
  processor: {
    name: 'Stripe Production',
    type: 'stripe',          // or 'sandbox' for testing
    enabled: true,
    supportedCurrencies: ['USD', 'EUR'],
    baseCurrency: 'USD',
    options: {
      secretKey: 'sk_live_...',
      publishableKey: 'pk_live_...',
    },
  },
});

// 2. Create a payment flow with routing & fallback
const flow = await tagada.paymentFlows.create({
  data: {
    name: 'Main Flow',
    strategy: 'simple',        // or 'weighted' for load balancing
    fallbackMode: true,        // retry on different PSP if first fails
    maxFallbackRetries: 2,
    threeDsEnabled: true,
    stickyProcessorEnabled: true,
    pickProcessorStrategy: 'weighted',
    processorConfigs: [
      { processorId: stripeId,  weight: 70, disabled: false },
      { processorId: adyenId,   weight: 30, disabled: false },
    ],
    fallbackProcessorConfigs: [
      { processorId: backupId,  weight: 100, disabled: false },
    ],
  },
});

// 3. Assign flow to your store
await tagada.stores.update(store.id, {
  selectedPaymentFlowId: flow.id,
});`}
        />
        <CodePanel
          title="Frontend — Tokenize & Pay"
          hookName="usePayment()"
          code={`import { useCheckout, usePayment } from '@tagadapay/headless-sdk/react';

const { session } = useCheckout(checkoutToken, sessionToken);
const { loadPaymentSetup, tokenizeCard, pay } = usePayment();

// 1. Load payment setup
useEffect(() => {
  if (session?.id) loadPaymentSetup(session.id);
}, [session?.id]);

// 2. Tokenize card (PCI-safe — never touches your server)
const { tagadaToken } = await tokenizeCard({
  cardNumber: '4242424242424242',
  expiryDate: '12/28',
  cvc: '123',
  cardholderName: 'John Doe',
});

// 3. Process payment
const result = await pay({
  checkoutSessionId: session.id,
  tagadaToken,
});

if (result.payment.status === 'succeeded') {
  console.log('Paid!', result.payment.id);
}`}
        />
      </div>
    </div>
  );
}
