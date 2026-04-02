import { useEffect, useState } from 'react';
import { useAnalytics, useOffers } from '@tagadapay/headless-sdk/react';
import type { Offer } from '@tagadapay/headless-sdk';

interface ConfirmationStepProps {
  paymentId: string | null;
  onReset: () => void;
}

export function ConfirmationStep({ paymentId, onReset }: ConfirmationStepProps) {
  const { trackPageView } = useAnalytics();
  const { listOffers, acceptOffer } = useOffers();
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    trackPageView('confirmation');
    listOffers({ type: 'upsell' }).then(setOffers).catch(() => {});
  }, [trackPageView, listOffers]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success card */}
      <div className="card-dark px-5 py-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
        <p className="mt-2 text-sm text-white/50">
          Your order has been placed and is being processed.
        </p>
        {paymentId && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-white/40">
            Payment ID: {paymentId}
          </p>
        )}
      </div>

      {/* Upsell offers */}
      {offers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70">Special Offers For You</h3>
          {offers.map((offer) => (
            <div key={offer.id} className="card-dark flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">{offer.title}</p>
                {offer.description && (
                  <p className="mt-0.5 text-xs text-white/40">{offer.description}</p>
                )}
              </div>
              <button
                onClick={() => acceptOffer({ offerId: offer.id, checkoutSessionId: '' })}
                className="rounded-lg bg-brand-500/20 px-4 py-2 text-xs font-medium text-brand-300 transition hover:bg-brand-500/30"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SDK Hooks used */}
      <div className="card-dark px-5 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">SDK Hooks Used</h3>
        <div className="flex flex-wrap gap-2">
          {['useCatalog', 'useCheckout', 'usePayment', 'useAnalytics', 'useOffers'].map((hook) => (
            <span key={hook} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 font-mono text-xs text-brand-300">
              {hook}()
            </span>
          ))}
        </div>
      </div>

      <button onClick={onReset} className="btn-primary w-full py-3 text-sm font-semibold">
        Start Over
      </button>
    </div>
  );
}
