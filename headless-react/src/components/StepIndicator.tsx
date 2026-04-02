interface StepIndicatorProps {
  steps: string[];
  current: string;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  const currentIndex = steps.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-500 text-white'
                    : isActive
                      ? 'border border-brand-400 bg-brand-500/20 text-brand-300'
                      : 'border border-white/10 bg-white/5 text-white/30'
                }`}
              >
                {isDone ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isActive ? 'text-white/80' : isDone ? 'text-white/50' : 'text-white/25'
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-4 sm:w-8 transition-colors duration-300 ${
                  i < currentIndex ? 'bg-brand-500/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
