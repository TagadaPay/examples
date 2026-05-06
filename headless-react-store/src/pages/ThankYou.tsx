import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOffers } from '@tagadapay/headless-sdk/react';
import type { Offer } from '@tagadapay/headless-sdk';
import { formatPrice, shortId } from '../lib/format';
import { BRAND } from '../lib/config';

/**
 * Confirmation page. We:
 *   1. Show the success message + order id.
 *   2. Pull post-purchase upsell offers (`useOffers().listOffers`).
 *   3. Let the buyer accept any offer in one click — `processOfferPayment`
 *      charges the stored instrument from the main order and handles 3DS
 *      / redirects automatically. After a redirect-and-return the
 *      `onOfferAccepted` / `onOfferDeclined` callback fires.
 */
export function ThankYou() {
  const { orderId } = useParams<{ orderId: string }>();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { listOffers, previewOffer, processOfferPayment, isLoading } = useOffers({
    onOfferAccepted: () => {
      // Resume after 3DS return — we don't know which offer it was, so
      // refresh the list and rely on the order page for the source of
      // truth. The accepted state is rebuilt from the order on next load.
      setError(null);
    },
    onOfferDeclined: (res) => setError(res.error),
  });

  useEffect(() => {
    listOffers({ type: 'upsell' })
      .then((result) => {
        setOffers(result);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load offers');
        setLoaded(true);
      });
  }, [listOffers]);

  const handleAccept = async (offer: Offer) => {
    if (!orderId) return;
    setAcceptingId(offer.id);
    setError(null);
    try {
      // Re-validate pricing right before charging — the offer can change
      // between list time and click time (currency switch, A/B test, etc.).
      await previewOffer({ offerId: offer.id });

      // One-click MIT charge. processOfferPayment handles 3DS redirects
      // and polling; if a redirect is needed the browser navigates to
      // the bank and resumes here on return (callbacks above).
      const result = await processOfferPayment({ offerId: offer.id, mainOrderId: orderId });

      if (result.status === 'succeeded') {
        setAccepted((prev) => new Set(prev).add(offer.id));
      }
      // 'requires_redirect' → page is navigating away; nothing to do.
      // 'failed' → onOfferDeclined fired and set error already.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to your order');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {/* Hero confirmation */}
      <div className="rounded-3xl border border-ink-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
          Thank you for your order
        </h1>
        <p className="mt-3 text-ink-600">
          We've sent a confirmation to your inbox. You'll get a tracking number as soon as your parcel ships.
        </p>
        {orderId && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-4 py-1.5 font-mono text-xs text-ink-600">
            Order <strong className="font-semibold text-ink-900">{shortId(orderId, 6, 6)}</strong>
          </p>
        )}
      </div>

      {/* Upsells */}
      {loaded && offers.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-700">One-time offer</p>
            <h2 className="mt-1 font-display text-2xl font-medium text-ink-900">
              Add these before your order ships
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              One click — your card stays the same. No checkout to do twice.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => {
              const isAccepted = accepted.has(offer.id);
              const isAccepting = acceptingId === offer.id;
              const item = offer.lineItems?.[0];
              const amount = offer.pricing?.amount ?? item?.unitAmount;
              const compareAt = offer.pricing?.compareAtAmount;
              const currency = offer.pricing?.currency ?? item?.currency ?? 'USD';

              return (
                <article
                  key={offer.id}
                  className="flex flex-col rounded-2xl border border-ink-200 bg-white p-4 transition hover:border-ink-300"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                      {item?.imageUrl ? (
                        <img src={item.imageUrl} alt={offer.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{offer.title}</p>
                      {offer.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-500">{offer.description}</p>
                      )}
                      {amount !== undefined && (
                        <p className="mt-1.5 text-sm font-semibold text-ink-900">
                          {formatPrice(amount, currency)}
                          {compareAt && compareAt > amount && (
                            <span className="ml-1.5 text-xs text-ink-400 line-through">
                              {formatPrice(compareAt, currency)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    {isAccepted ? (
                      <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-emerald-100 text-xs font-medium text-emerald-800">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Added to your order
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAccept(offer)}
                        disabled={isAccepting || isLoading}
                        className="inline-flex h-10 w-full items-center justify-center rounded-full bg-ink-900 px-4 text-xs font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
                      >
                        {isAccepting ? 'Adding…' : 'Add to my order'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-col items-center gap-2">
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-full border border-ink-300 bg-white px-5 text-sm font-medium text-ink-800 transition hover:bg-ink-100"
        >
          Continue shopping
        </Link>
        <p className="text-xs text-ink-400">
          Questions? Reply to your confirmation email — we read every one.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-ink-300">{BRAND.name} · Powered by TagadaPay</p>
      </div>
    </div>
  );
}
