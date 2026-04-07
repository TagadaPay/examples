import { ExternalLink, Shield, Scan } from 'lucide-react';
import type { FlowStep } from '@/hooks/useCardPayment';

interface ActionRequiredProps {
  flowStep: FlowStep;
  redirectUrl: string | null;
  paymentId: string | null;
}

function RadarPanel() {
  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/60">
      <div className="border-b border-blue-200 bg-blue-50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 shadow-sm">
            <Scan size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">Device Fingerprint Check</h3>
            <p className="text-[11px] text-blue-500">Airwallex Radar</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            <span className="text-[11px] font-medium text-blue-600">Running</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-xs leading-relaxed text-slate-600">
          Airwallex is collecting device signals to verify this transaction.
          This happens automatically — no action required.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Collecting device signals...</span>
            <span className="font-medium text-blue-600">Please wait</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 animate-progress-fill" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Browser info', 'Device ID', 'Risk signals', 'Session data'].map((item) => (
            <span key={item} className="rounded-lg border border-blue-200 bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-600">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreeDSPanel({ redirectUrl, paymentId }: { redirectUrl: string; paymentId: string }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
      <div className="border-b border-amber-200 bg-amber-50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 shadow-sm">
            <Shield size={15} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Authentication Required</h3>
            <p className="text-[11px] text-amber-500">3D Secure Challenge</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium text-amber-600">Action needed</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-xs leading-relaxed text-slate-600">
          Your bank requires you to verify this payment. You'll be redirected to complete
          authentication and automatically returned here once complete.
        </p>
        <button
          onClick={() => { window.location.href = redirectUrl; }}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
        >
          <Shield size={15} />
          Authenticate Payment
          <ExternalLink size={13} />
        </button>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Payment ID</span>
            <span className="font-mono text-[10px] text-slate-600">{paymentId}</span>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
            If you're not redirected automatically, click the button above. Your session
            will resume automatically after authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActionRequired({ flowStep, redirectUrl, paymentId }: ActionRequiredProps) {
  if (flowStep === 'radar') return <RadarPanel />;
  if (flowStep === 'redirect' && redirectUrl && paymentId) {
    return <ThreeDSPanel redirectUrl={redirectUrl} paymentId={paymentId} />;
  }
  return null;
}
