import { Link, useSearchParams } from 'react-router-dom';
import { useOrder } from '@tagadapay/headless-sdk/react';
import { Offer } from './Offer';
import { HOODIE_OFFER_ID, PREMIUM_THRESHOLD, SOCKS_OFFER_ID } from '../lib/config';

/**
 * The demo's routing brain: one route (/offer), two possible offers.
 * Unlike the geo and tag demos this signal is not simulated — the real
 * main-order total decides. Hosted funnels do the same thing with
 * mainOrder.totalGreaterThan and an `always` fallback edge.
 */
export function ValueOffer() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const { order, isLoading } = useOrder(orderId);

  if (!orderId) {
    return (
      <main className="page">
        <div className="card">
          <h1>Missing order</h1>
          <p>This page needs ?orderId= from checkout.</p>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading || !order) {
    return (
      <main className="page">
        <p>Checking your order total…</p>
      </main>
    );
  }

  if (order.amount >= PREMIUM_THRESHOLD) {
    return (
      <Offer
        offerId={HOODIE_OFFER_ID}
        title="Heavyweight Hoodie — big-cart exclusive"
        priceLabel="$39.00"
        matched='mainOrder.totalGreaterThan { amount: 5000 }'
        imageUrl="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=1100&fit=crop&q=80"
        acceptPath="/thank-you"
        declinePath="/thank-you"
      />
    );
  }

  return (
    <Offer
      offerId={SOCKS_OFFER_ID}
      title="Crew Socks — easy add-on"
      priceLabel="$9.00"
      matched="always (fallback edge)"
      imageUrl="https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=900&h=1100&fit=crop&q=80"
      acceptPath="/thank-you"
      declinePath="/thank-you"
    />
  );
}
