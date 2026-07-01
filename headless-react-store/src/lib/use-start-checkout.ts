import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeadlessClient } from '@tagadapay/headless-sdk/react';
import { useCart } from './cart';

/**
 * Starts a checkout from the current cart and navigates to `/checkout`.
 *
 * Shared by the cart page and the cart drawer so the "Checkout" button behaves
 * identically wherever it appears.
 *
 * `createSessionUrl` creates the session and returns a self-hosted redirect URL
 * of the form `/checkout?checkoutToken=…&sessionToken=…` — the convention the
 * checkout page reads on the next hop.
 *
 * It also sets the session's `checkoutUrl` to this storefront
 * (`${origin}${checkoutPath}`), which is what payment-auth redirects (3DS / APM)
 * return to. That's what keeps the buyer on OUR storefront through 3DS instead
 * of bouncing to the Tagada-hosted checkout. On return the URL carries
 * `?paymentAction=requireAction&…&paymentId=…`, which `usePayment()` on
 * `/checkout` auto-detects to finalize the order.
 */
export function useStartCheckout() {
  const client = useHeadlessClient();
  const { lines, currency } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (lines.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        ...(l.priceId ? { priceId: l.priceId } : {}),
      }));

      const { url } = await client.checkout.createSessionUrl({
        items,
        currency,
        checkoutPath: '/checkout',
      });

      // SPA navigate keeps client state. Strip origin to use react-router.
      navigate(url.replace(window.location.origin, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return { start, submitting, error };
}
