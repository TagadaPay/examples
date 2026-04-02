import { useCheckout } from '@tagadapay/headless-sdk/react';
import { useAnalytics } from '@tagadapay/headless-sdk/react';

interface Props {
  onContinue: () => void;
}

const DEMO_PRODUCT = {
  name: 'Premium Starter Kit',
  description: 'Everything you need to launch your next project. Includes templates, components, and lifetime updates.',
  price: '$49.00',
  features: ['Lifetime access', 'All future updates', 'Premium support', 'Source code included'],
  image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop&q=80',
};

export function ProductStep({ onContinue }: Props) {
  const { session, isLoading } = useCheckout(null);
  const { trackViewContent } = useAnalytics();

  const handleContinue = () => {
    trackViewContent({ value: 4900, currency: 'USD' });
    onContinue();
  };

  return (
    <div className="animate-slide-up">
      {/* Product Card */}
      <div className="card-dark overflow-hidden">
        {/* Product Image */}
        <div className="relative -mx-6 -mt-6 mb-6 h-48 overflow-hidden bg-gradient-to-br from-brand-500/20 to-indigo-500/20">
          <img
            src={DEMO_PRODUCT.image}
            alt={DEMO_PRODUCT.name}
            className="h-full w-full object-cover opacity-60 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/20 mb-2">
              Featured
            </span>
            <h2 className="text-xl font-bold tracking-tight">{DEMO_PRODUCT.name}</h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-white/50">{DEMO_PRODUCT.description}</p>

        {/* Features */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {DEMO_PRODUCT.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-xs text-white/60">{feature}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-6">
          <div>
            <p className="text-2xl font-bold tracking-tight">{DEMO_PRODUCT.price}</p>
            <p className="text-xs text-white/30">One-time payment</p>
          </div>
          <button onClick={handleContinue} className="btn-primary">
            Continue to Checkout
            <svg className="ml-2 -mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* SDK Hook Info */}
      <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-500/20">
            <span className="text-[10px]">{'</>'}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white/50">Hooks used on this step</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useCheckout()</code>
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useAnalytics()</code>
            </div>
            {session && (
              <p className="mt-1 text-[10px] text-white/25">Session loaded: {session.id}</p>
            )}
            {isLoading && (
              <p className="mt-1 text-[10px] text-white/25">Loading session...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
