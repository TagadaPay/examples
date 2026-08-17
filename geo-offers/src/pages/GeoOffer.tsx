import { Offer } from './Offer';
import { EU_OFFER_ID, ROW_OFFER_ID, US_OFFER_ID } from '../lib/config';
import { getRegion, type Region } from '../lib/region';

/**
 * The demo's routing brain: one route (/offer), three possible offers.
 * Hosted funnels do the same thing with three edges out of the checkout
 * step — customer.fromCountry, customer.fromEU, and an `always` fallback.
 */
const OFFER_BY_REGION: Record<
  Region,
  { offerId: string; title: string; priceLabel: string; matched: string; imageUrl: string }
> = {
  us: {
    offerId: US_OFFER_ID,
    title: 'Add the Varsity Cap',
    priceLabel: '$19.99',
    matched: 'customer.fromCountry { country: "US" }',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&h=1100&fit=crop&q=80',
  },
  eu: {
    offerId: EU_OFFER_ID,
    title: 'Add the Alpine Beanie',
    priceLabel: '$17.99',
    matched: 'customer.fromEU',
    imageUrl: 'https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?w=900&h=1100&fit=crop&q=80',
  },
  row: {
    offerId: ROW_OFFER_ID,
    title: 'Add the Travel Tote',
    priceLabel: '$24.00',
    matched: 'always (fallback edge)',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&h=1100&fit=crop&q=80',
  },
};

export function GeoOffer() {
  const offer = OFFER_BY_REGION[getRegion()];
  return <Offer {...offer} acceptPath="/thank-you" declinePath="/thank-you" />;
}
