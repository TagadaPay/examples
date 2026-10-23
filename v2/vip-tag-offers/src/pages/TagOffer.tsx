import { Offer } from './Offer';
import { VIP_OFFER_ID, WELCOME_OFFER_ID } from '../lib/config';
import { hasTag } from '../lib/tags';

/**
 * The demo's routing brain: one route (/offer), two possible offers.
 * Hosted funnels do the same thing with two edges out of the checkout
 * step — customer.hasTag { tag: "vip" } and an `always` fallback.
 */
export function TagOffer() {
  const vip = hasTag('vip');

  if (vip) {
    return (
      <Offer
        offerId={VIP_OFFER_ID}
        title="Members Hoodie — VIP only"
        priceLabel="$39.00"
        matched='customer.hasTag { tag: "vip" }'
        imageUrl="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=1100&fit=crop&q=80"
        acceptPath="/thank-you"
        declinePath="/thank-you"
      />
    );
  }

  return (
    <Offer
      offerId={WELCOME_OFFER_ID}
      title="Welcome Cap — first-order price"
      priceLabel="$14.99"
      matched="always (fallback edge)"
      imageUrl="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&h=1100&fit=crop&q=80"
      acceptPath="/thank-you"
      declinePath="/thank-you"
    />
  );
}
