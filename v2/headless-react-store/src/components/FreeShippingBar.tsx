import { FREE_SHIPPING_THRESHOLD_CENTS } from '../lib/config';
import { formatPrice } from '../lib/format';

/**
 * A progress bar toward the free-shipping threshold — a small conversion nudge
 * that Shopify stores lean on. Reused in the cart drawer and the cart page.
 */
export function FreeShippingBar({
  subtotalCents,
  currency,
}: {
  subtotalCents: number;
  currency: string;
}) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const qualified = remaining === 0;
  const pct = Math.min(1, subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS);

  return (
    <div>
      <p className="text-xs text-ink-600">
        {qualified ? (
          <span className="font-medium text-emerald-700">You've unlocked free shipping.</span>
        ) : (
          <>
            You're <span className="font-medium text-ink-900">{formatPrice(remaining, currency)}</span> away
            from free shipping.
          </>
        )}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className={`h-full origin-left rounded-full transition-transform duration-500 ease-out-expo ${
            qualified ? 'bg-emerald-500' : 'bg-ink-900'
          }`}
          style={{ transform: `scaleX(${pct})` }}
        />
      </div>
    </div>
  );
}
