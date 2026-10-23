import { CheckCircle2, XCircle, Loader2, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { useConfigStore } from '@/lib/config-store';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';
import { JsonViewer } from '@/components/ui/JsonViewer';

interface TestReturnPageProps {
  paymentId: string;
}

function PollingState({ paymentId, pollCount }: { paymentId: string; pollCount: number }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
        {pollCount > 0 && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm">
            {pollCount}
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold text-slate-900">Verifying Payment</h2>
      <p className="mt-2 text-sm text-slate-500">Checking status with the payment processor...</p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-[10px] text-slate-400">Payment ID</p>
        <p className="font-mono text-xs text-slate-600">{paymentId}</p>
      </div>
    </div>
  );
}

function SuccessState({ paymentId, payment }: {
  paymentId: string;
  payment: { payment: { id: string; amount: number; currency: string; status: string; createdAt: string } };
}) {
  const p = payment.payment;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-200 bg-green-50 animate-scale-in">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Payment Verified</h2>
      <p className="mt-2 text-sm text-slate-500">Your authentication was successful and the payment is complete.</p>
      <div className="mt-6 w-full max-w-sm space-y-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Payment ID</span>
          <span className="font-mono text-xs text-slate-700">{p.id || paymentId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Amount</span>
          <span className="font-mono text-xs text-slate-700">${(p.amount / 100).toFixed(2)} {p.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Status</span>
          <span className="rounded-lg bg-green-100 px-2 py-px font-mono text-[10px] font-semibold text-green-700">
            {p.status}
          </span>
        </div>
      </div>
      <div className="mt-4 w-full max-w-sm">
        <JsonViewer data={payment} title="Full Response" defaultCollapsed />
      </div>
    </div>
  );
}

function FailedState({ status, payment }: { status: string; payment: unknown }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-200 bg-red-50 animate-scale-in">
        <XCircle size={40} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">
        Payment {status.charAt(0).toUpperCase() + status.slice(1)}
      </h2>
      <p className="mt-2 text-sm text-slate-500">The payment was not completed successfully.</p>
      <div className="mt-4 w-full max-w-sm">
        <JsonViewer data={payment} title="Response Details" defaultCollapsed />
      </div>
    </div>
  );
}

function MissingConfigState() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50">
        <AlertTriangle size={36} className="text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Configuration Missing</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500 leading-relaxed">
        Your API token or base URL is not configured. Open the app and configure your credentials in the sidebar first.
      </p>
    </div>
  );
}

export function TestReturnPage({ paymentId }: TestReturnPageProps) {
  const config = useConfigStore();
  const apiBaseUrl = config.getApiBaseUrl();
  const apiToken = config.apiToken;

  const { payment, isPolling, pollCount, error } = usePaymentPolling({
    paymentId,
    apiBaseUrl,
    apiToken,
  });

  const backToApp = () => {
    window.location.href = window.location.pathname;
  };

  const status = payment?.payment?.status;
  const isSuccess = status === 'succeeded' || status === 'approved' || status === 'captured';
  const isFailed = status === 'declined' || status === 'failed' || status === 'cancelled';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        {/* Logo / header */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold">
            <span className="text-blue-600">Tagada</span>
            <span className="text-slate-800">Pay</span>
          </span>
          <p className="mt-1 font-mono text-xs text-slate-400">Card Payment Example</p>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {!apiToken || !apiBaseUrl ? (
            <MissingConfigState />
          ) : error ? (
            <div className="flex flex-col items-center text-center">
              <AlertTriangle size={36} className="mb-4 text-amber-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : isPolling && !payment ? (
            <PollingState paymentId={paymentId} pollCount={pollCount} />
          ) : isSuccess && payment ? (
            <SuccessState
              paymentId={paymentId}
              payment={payment as Parameters<typeof SuccessState>[0]['payment']}
            />
          ) : isFailed && payment ? (
            <FailedState status={status!} payment={payment} />
          ) : payment ? (
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Status: <span className="font-mono text-amber-600">{status}</span>
              </p>
              <JsonViewer data={payment} title="Payment Response" defaultCollapsed />
            </div>
          ) : (
            <PollingState paymentId={paymentId} pollCount={pollCount} />
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            {!isPolling && (
              <button onClick={() => window.location.reload()} className="btn-secondary text-xs">
                <RefreshCw size={12} />
                Retry
              </button>
            )}
            <button onClick={backToApp} className="btn-secondary text-xs">
              <ArrowLeft size={12} />
              Back to App
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Payment ID: <span className="font-mono">{paymentId}</span>
        </p>
      </div>
    </div>
  );
}
