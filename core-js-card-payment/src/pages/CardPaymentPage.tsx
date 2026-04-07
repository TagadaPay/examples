import { useState } from 'react';
import { CreditCard, RotateCcw } from 'lucide-react';
import { useConfigStore } from '@/lib/config-store';
import { usePaymentLogger } from '@/hooks/usePaymentLogger';
import { useCardPayment } from '@/hooks/useCardPayment';
import { CardForm, type CardData } from '@/components/form/CardForm';
import { AmountInput } from '@/components/form/AmountInput';
import { FlowProgress } from '@/components/flow/FlowProgress';
import { ActionRequired } from '@/components/flow/ActionRequired';
import { PaymentResult } from '@/components/flow/PaymentResult';
import { LogPanel } from '@/components/ui/LogPanel';
import { ConfigPanel } from '@/components/config/ConfigPanel';

function EmptyState() {
  return (
    <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <CreditCard size={18} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">No payment yet</p>
        <p className="mt-1 text-xs text-slate-400">Fill in card details and click Pay Now</p>
      </div>
    </div>
  );
}

export function CardPaymentPage() {
  const config = useConfigStore();
  const logger = usePaymentLogger();
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState('USD');

  const {
    flowStep,
    piResult,
    payment,
    error,
    isInitialized,
    startPayment,
    reset,
    redirectUrl,
    pendingPaymentId,
  } = useCardPayment({ config, logger });

  const isProcessing = !['idle', 'succeeded', 'failed'].includes(flowStep);

  const handleSubmit = (card: CardData) => {
    startPayment(card, amount, currency);
  };

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-5">
      {/* Config sections */}
      <ConfigPanel />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <CreditCard size={16} className="text-blue-600" />
            </div>
            Card Payment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a test card, tokenize, and process a payment. Handles Airwallex Radar and 3DS redirects automatically.
          </p>
        </div>
        {flowStep !== 'idle' && (
          <button onClick={reset} className="btn-secondary shrink-0">
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Flow progress strip */}
      <FlowProgress step={flowStep} />

      {/* Error banner */}
      {error && (
        <div className="animate-fade-in rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">Error: </strong>{error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="card p-5">
            <CardForm
              onSubmit={handleSubmit}
              isLoading={isProcessing}
              isInitialized={isInitialized}
              error={null}
              submitLabel="Pay Now"
            />
          </div>
          <div className="card p-4">
            <AmountInput
              amount={amount}
              currency={currency}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrency}
            />
          </div>
        </div>

        {/* Right: Flow state + result + log */}
        <div className="space-y-4">
          {flowStep === 'idle' && <EmptyState />}

          {(flowStep === 'radar' || flowStep === 'redirect') && (
            <ActionRequired
              flowStep={flowStep}
              redirectUrl={redirectUrl}
              paymentId={pendingPaymentId}
            />
          )}

          {payment && <PaymentResult payment={payment} piResult={piResult} />}

          <LogPanel logs={logger.logs} title="Payment Log" />
        </div>
      </div>
    </div>
  );
}
