interface Props {
  steps: readonly string[];
  current: string;
}

export function StepIndicator({ steps, current }: Props) {
  const currentIdx = steps.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-1">
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : isCurrent
                      ? 'bg-white/10 text-white ring-2 ring-brand-500/40'
                      : 'bg-white/5 text-white/25'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  isCurrent ? 'text-white/80' : isCompleted ? 'text-brand-400' : 'text-white/20'
                }`}
              >
                {step}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`mx-2 h-px w-6 sm:w-10 transition-colors duration-300 ${
                  i < currentIdx ? 'bg-brand-500/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
