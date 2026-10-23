import { CheckCircle2, XCircle, Clock, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { JsonViewer } from '@/components/ui/JsonViewer';
import type { PaymentResult, PaymentInstrumentResult } from '@/lib/api';

function StatusBanner({ status }: { status: string }) {
  const isSuccess = status === 'succeeded' || status === 'approved' || status === 'captured';
  const isFailed = status === 'declined' || status === 'failed' || status === 'cancelled';

  if (isSuccess) {
    return (
      <div className="flex items-center gap-3 rounded-t-2xl border-b border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 size={22} className="shrink-0 text-green-500" />
        <div>
          <p className="text-sm font-semibold text-green-800">Payment Successful</p>
          <p className="text-[11px] text-green-500">Transaction completed</p>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="flex items-center gap-3 rounded-t-2xl border-b border-red-200 bg-red-50 px-5 py-4">
        <XCircle size={22} className="shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Payment {status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
          <p className="text-[11px] text-red-400">Transaction was not completed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-t-2xl border-b border-amber-200 bg-amber-50 px-5 py-4">
      <Clock size={22} className="shrink-0 text-amber-500" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
        <p className="text-[11px] text-amber-400">Awaiting action</p>
      </div>
    </div>
  );
}

function CopyableId({ value }: { value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Copied');
  };
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-1.5 font-mono text-[11px] text-slate-600 transition-colors hover:text-slate-900"
    >
      <span className="max-w-[160px] truncate">{value}</span>
      <Copy size={10} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function StatusBadge({
  value,
  variant = 'neutral',
}: {
  value: string;
  variant?: 'green' | 'red' | 'amber' | 'neutral';
}) {
  const cls = {
    green:   'bg-green-100 text-green-700 border-green-200',
    red:     'bg-red-100 text-red-700 border-red-200',
    amber:   'bg-amber-100 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }[variant];
  return (
    <span className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium ${cls}`}>
      {value}
    </span>
  );
}

interface PaymentResultProps {
  payment: PaymentResult;
  piResult?: PaymentInstrumentResult | null;
}

export function PaymentResult({ payment, piResult }: PaymentResultProps) {
  const p = payment.payment;
  const status = p.status;

  const isSuccess = status === 'succeeded' || status === 'approved' || status === 'captured';
  const isFailed = status === 'declined' || status === 'failed';

  const borderColor = isSuccess
    ? 'border-l-green-500'
    : isFailed
    ? 'border-l-red-500'
    : 'border-l-amber-400';

  const statusVariant = isSuccess ? 'green' : isFailed ? 'red' : 'amber';

  return (
    <div className={`animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm border-l-4 ${borderColor}`}>
      <StatusBanner status={status} />
      <div className="space-y-4 p-5">
        <div className="space-y-0">
          <div className="flex items-center justify-between border-b border-slate-100 py-2">
            <span className="text-[11px] text-slate-500">Payment ID</span>
            <CopyableId value={p.id} />
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 py-2">
            <span className="text-[11px] text-slate-500">Amount</span>
            <span className="font-mono text-[11px] font-medium text-slate-700">
              ${(p.amount / 100).toFixed(2)} {p.currency}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 py-2">
            <span className="text-[11px] text-slate-500">Status</span>
            <StatusBadge value={status} variant={statusVariant} />
          </div>
          {p.subStatus && (
            <div className="flex items-center justify-between border-b border-slate-100 py-2">
              <span className="text-[11px] text-slate-500">Sub-status</span>
              <StatusBadge value={p.subStatus} />
            </div>
          )}
          {p.requireAction && p.requireAction !== 'none' && (
            <div className="flex items-center justify-between border-b border-slate-100 py-2">
              <span className="text-[11px] text-slate-500">Require Action</span>
              <StatusBadge value={p.requireAction} variant="amber" />
            </div>
          )}
          {piResult && (
            <div className="flex items-center justify-between border-b border-slate-100 py-2">
              <span className="text-[11px] text-slate-500">Card</span>
              <span className="font-mono text-[11px] text-slate-700">
                {piResult.paymentInstrument.card.brand} ····{piResult.paymentInstrument.card.last4}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-[11px] text-slate-500">Created</span>
            <span className="text-[11px] text-slate-500">
              {new Date(p.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <JsonViewer data={payment} title="Full Response" defaultCollapsed />
      </div>
    </div>
  );
}
