import { Check, X, Loader2, Scan, Shield } from 'lucide-react';
import type { FlowStep } from '@/hooks/useCardPayment';

const STEPS: Array<{ label: string }> = [
  { label: 'Tokenize' },
  { label: 'Create PI' },
  { label: 'Process' },
  { label: 'Complete' },
];

function getStepIndex(step: FlowStep): number {
  if (step === 'idle') return -1;
  if (step === 'tokenizing') return 0;
  if (step === 'creating-pi') return 1;
  if (step === 'processing') return 2;
  return 3;
}

interface StepNodeProps {
  label: string;
  stepIdx: number;
  currentIdx: number;
  flowStep: FlowStep;
}

function StepNode({ label, stepIdx, currentIdx, flowStep }: StepNodeProps) {
  const isDone = currentIdx > stepIdx && flowStep !== 'failed';
  const isActive = currentIdx === stepIdx;
  const isFailed = flowStep === 'failed' && currentIdx === stepIdx;

  let displayLabel = label;
  let icon: React.ReactNode = null;

  if (stepIdx === 3) {
    if (flowStep === 'radar') { displayLabel = 'Radar'; icon = <Scan size={11} />; }
    else if (flowStep === 'redirect') { displayLabel = '3DS Auth'; icon = <Shield size={11} />; }
    else if (flowStep === 'succeeded') { displayLabel = 'Done'; }
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300
          ${isDone ? 'bg-green-500 text-white shadow-sm'
            : isFailed ? 'bg-red-500 text-white'
            : isActive && flowStep === 'redirect' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300 animate-pulse-ring'
            : isActive ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300 animate-pulse-ring'
            : 'bg-slate-100 text-slate-400'}
        `}
      >
        {isDone ? <Check size={12} />
          : isFailed ? <X size={12} />
          : isActive ? (icon || <Loader2 size={11} className="animate-spin" />)
          : <span>{stepIdx + 1}</span>}
      </div>
      <span className={`text-xs font-medium transition-colors duration-300 ${
        isDone ? 'text-green-600'
          : isFailed ? 'text-red-500'
          : isActive ? 'font-semibold text-slate-900'
          : 'text-slate-400'
      }`}>
        {displayLabel}
      </span>
    </div>
  );
}

interface FlowProgressProps {
  step: FlowStep;
}

export function FlowProgress({ step }: FlowProgressProps) {
  if (step === 'idle') return null;

  const currentIdx = getStepIndex(step);

  return (
    <div className="card animate-fade-in px-5 py-3.5">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-8 flex-1 transition-all duration-500 ${
                currentIdx > i - 1 && step !== 'failed' ? 'bg-green-400' : 'bg-slate-200'
              }`} />
            )}
            <StepNode label={s.label} stepIdx={i} currentIdx={currentIdx} flowStep={step} />
          </div>
        ))}
      </div>
    </div>
  );
}
