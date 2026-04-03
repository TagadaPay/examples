import { useEffect, useState } from 'react';
import { useOffers } from '@tagadapay/headless-sdk/react';
import type { Offer } from '@tagadapay/headless-sdk';
import { CodePanel } from './CodePanel';

interface ConfirmationStepProps {
  paymentId: string | null;
  onReset: () => void;
}

export function ConfirmationStep({ paymentId, onReset }: ConfirmationStepProps) {
  const { listOffers, previewOffer, payPreviewedOffer, isLoading } = useOffers();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [offerError, setOfferError] = useState<string | null>(null);

  const [offersLoaded, setOffersLoaded] = useState(false);

  useEffect(() => {
    listOffers({ type: 'upsell' })
      .then((result) => {
        setOffers(result);
        setOffersLoaded(true);
      })
      .catch((err) => {
        setOfferError(err instanceof Error ? err.message : 'Failed to load offers');
        setOffersLoaded(true);
      });
  }, [listOffers]);

  const handleAcceptOffer = async (offer: Offer) => {
    if (!paymentId) return;
    setAcceptingId(offer.id);
    setOfferError(null);
    try {
      await previewOffer({ offerId: offer.id });
      await payPreviewedOffer({
        offerId: offer.id,
        mainOrderId: paymentId,
      });
      setAcceptedIds((prev) => new Set(prev).add(offer.id));
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setAcceptingId(null);
    }
  };

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
      {offersLoaded && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <h3 className="text-sm font-semibold text-white/70">Post-Purchase Upsells</h3>
          </div>

          {offerError && !offers.length && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">{offerError}</p>
            </div>
          )}

          {offers.length === 0 && !offerError && (
            <div className="card-dark px-5 py-6 text-center">
              <p className="text-sm text-white/40">No upsell offers configured for this store.</p>
              <p className="mt-1.5 text-xs text-white/25">
                Create offers in your{' '}
                <a href="https://app.tagadapay.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
                  Tagada dashboard
                </a>
                {' '}or via the{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-brand-300">pnpm seed</code>
                {' '}script to see them here.
              </p>
            </div>
          )}

          {offers.length > 0 && (
            <>
              {offerError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs text-red-400">{offerError}</p>
                </div>
              )}
              {offers.map((offer) => {
                const accepted = acceptedIds.has(offer.id);
                const accepting = acceptingId === offer.id;
                return (
                  <div key={offer.id} className="card-dark flex items-center gap-4 px-5 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">{offer.title}</p>
                      {offer.description && (
                        <p className="mt-0.5 text-xs text-white/40">{offer.description}</p>
                      )}
                      {offer.pricing && (
                        <p className="mt-1 text-xs font-semibold text-brand-300">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: offer.pricing.currency,
                          }).format(offer.pricing.amount / 100)}
                        </p>
                      )}
                    </div>
                    {accepted ? (
                      <span className="flex items-center gap-1 rounded-lg bg-green-500/20 px-4 py-2 text-xs font-medium text-green-300">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        disabled={accepting || isLoading}
                        className="rounded-lg bg-brand-500/20 px-4 py-2 text-xs font-medium text-brand-300 transition hover:bg-brand-500/30 disabled:opacity-50"
                      >
                        {accepting ? 'Adding...' : 'Accept'}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        <CodePanel
          title="Backend — Create Upsell Offers"
          hookName="node-sdk"
          variant="backend"
          code={`import Tagada from '@tagadapay/node-sdk';
const tagada = new Tagada('tgd_your_api_key');

// Upsell offers appear AFTER payment — one-click purchase
// (customer's card is already on file, no re-entry needed)
await tagada.offers.create({
  storeId: store.id,
  offerTitle: 'Add a Fast Charger — 25% off',
  enabled: true,
  type: 'upsell',           // shown post-purchase
  triggers: [
    { productId: null, type: 'any' },  // trigger on any purchase
  ],
  offers: [{
    productId: charger.id,
    variantId: chargerVariant.id,
    priceId: chargerVariant.prices[0].id,
    title: 'USB-C Fast Charger',
    titleTrans: { en: 'Add a Fast Charger — 25% off' },
  }],
});

// You can create multiple upsells — they'll show in sequence
await tagada.offers.create({
  storeId: store.id,
  offerTitle: 'Upgrade to Premium Headphones',
  enabled: true,
  type: 'upsell',
  triggers: [{ productId: null, type: 'any' }],
  offers: [{
    productId: headphones.id,
    variantId: headphonesVariant.id,
    priceId: headphonesVariant.prices[0].id,
    title: 'Premium Wireless Headphones',
  }],
});`}
        />
        <CodePanel
          title="Frontend — Display & Accept Upsells"
          hookName="useOffers()"
          code={`import { useOffers } from '@tagadapay/headless-sdk/react';

const { listOffers, previewOffer, payPreviewedOffer } = useOffers();

// 1. List available upsell offers after payment
const offers = await listOffers({ type: 'upsell' });

// 2. Preview an offer (shows price, description)
await previewOffer({ offerId: offers[0].id });

// 3. One-click accept — charges the same card
await payPreviewedOffer({
  offerId: offers[0].id,
  mainOrderId: paymentId,   // from the main order
});`}
        />
      </div>

      <button onClick={onReset} className="btn-primary w-full py-3 text-sm font-semibold">
        Start Over
      </button>
    </div>
  );
}
