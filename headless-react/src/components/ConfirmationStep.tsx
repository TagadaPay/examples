import { useEffect, useState } from 'react';
import { useAnalytics, useOffers } from '@tagadapay/headless-sdk/react';

interface Props {
  paymentId: string | null;
  onReset: () => void;
}

export function ConfirmationStep({ paymentId, onReset }: Props) {
  const { trackPurchase, trackConversion } = useAnalytics();
  const { offer, acceptOffer, declineOffer, isLoading: offersLoading, result: offerResult } = useOffers();
  const [showUpsell, setShowUpsell] = useState(true);
  const [upsellDismissed, setUpsellDismissed] = useState(false);

  useEffect(() => {
    if (paymentId) {
      trackPurchase({ orderId: paymentId, amount: 4900, currency: 'USD' });
      trackConversion({ orderId: paymentId, amount: 4900, currency: 'USD' });
    }
  }, [paymentId, trackPurchase, trackConversion]);

  const handleAcceptOffer = async () => {
    if (!offer || !paymentId) return;
    try {
      await acceptOffer({ offerId: offer.id, checkoutSessionId: paymentId });
      setShowUpsell(false);
    } catch {
      // offer acceptance failed silently
    }
  };

  const handleDeclineOffer = async () => {
    if (!offer || !paymentId) return;
    try {
      await declineOffer({ offerId: offer.id, checkoutSessionId: paymentId });
    } catch {
      // decline failed silently
    }
    setShowUpsell(false);
    setUpsellDismissed(true);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Success Card */}
      <div className="card-dark text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 ring-4 ring-brand-500/10">
          <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold tracking-tight">Payment Successful</h2>
        <p className="mt-2 text-sm text-white/40">
          Your order has been confirmed and is being processed.
        </p>

        {paymentId && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
            <span className="text-xs text-white/30">Payment ID</span>
            <code className="font-mono text-xs text-brand-300">{paymentId}</code>
          </div>
        )}

        {/* Receipt Details */}
        <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Status</span>
              <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Succeeded
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Date</span>
              <span className="text-white/60">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Method</span>
              <span className="text-white/60">Card ending ****</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upsell Offer (demo) */}
      {showUpsell && !upsellDismissed && (
        <div className="card-dark border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
              <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-indigo-300/80">Special Offer</p>
              <h4 className="mt-0.5 text-sm font-semibold">
                {offer?.title || 'Upgrade to Pro — 50% off'}
              </h4>
              <p className="mt-1 text-xs text-white/40">
                {offer?.description || 'Get advanced features, priority support, and unlimited exports. One-click add to your order.'}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handleAcceptOffer}
                  disabled={offersLoading}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-400"
                >
                  {offersLoading ? 'Adding...' : 'Add for $24.50'}
                </button>
                <button
                  onClick={handleDeclineOffer}
                  className="rounded-lg px-4 py-2 text-xs text-white/40 transition-all hover:text-white/60"
                >
                  No thanks
                </button>
              </div>

              {offerResult?.success && (
                <p className="mt-2 text-xs text-brand-400">Added to your order!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center">
        <button onClick={onReset} className="btn-ghost">
          <svg className="mr-1.5 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          Start New Checkout
        </button>
      </div>

      {/* Hook Info */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-500/20">
            <span className="text-[10px]">{'</>'}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white/50">Hooks used on this step</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useAnalytics()</code>
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useOffers()</code>
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">
              trackPurchase &middot; trackConversion &middot; acceptOffer &middot; declineOffer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
