import { Link } from 'react-router-dom';
import type { CatalogProduct } from '@tagadapay/headless-sdk';
import { useCart } from '../lib/cart';
import { useCartUI } from '../lib/cart-ui';
import { formatPrice } from '../lib/format';

interface ProductCardProps {
  product: CatalogProduct;
}

/**
 * Product tile for the home grid.
 *
 * Picks the default variant + its default price, displays the compare-at as a
 * struck-through reference price when present. A "Quick add" button (revealed
 * on hover, always shown on touch) drops the item in the cart and pops the
 * drawer without leaving the grid.
 */
export function ProductCard({ product }: ProductCardProps) {
  const { addLine } = useCart();
  const { open: openCart } = useCartUI();
  const variant = product.variants?.[0];
  if (!variant) return null;

  const price = variant.prices?.find((p) => p.default) ?? variant.prices?.[0];
  const currency = variant.currency ?? 'USD';
  const currencyOpt =
    price?.currencyOptions?.[currency] ??
    (price?.currencyOptions
      ? price.currencyOptions[Object.keys(price.currencyOptions)[0] as string]
      : undefined);

  const amount = currencyOpt?.amount ?? variant.price ?? 0;
  const compareAt = variant.compareAtPrice;
  const isRecurring = price?.recurring ?? false;
  const soldOut = variant.inStock === false;

  const handleQuickAdd = (e: React.MouseEvent) => {
    // The whole card is a link; keep the click on the button.
    e.preventDefault();
    e.stopPropagation();
    addLine({
      variantId: variant.id,
      priceId: price?.id,
      productName: product.name,
      variantName: variant.name,
      price: amount,
      currency,
      imageUrl: variant.imageUrl,
      quantity: 1,
    });
    openCart();
  };

  return (
    <Link
      to={`/product/${variant.id}`}
      className="group block animate-fade-in"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-900/[0.04] transition-shadow duration-300 ease-out-expo group-hover:shadow-[0_18px_40px_-24px_rgba(28,25,23,0.45)]">
        {variant.imageUrl ? (
          <img
            src={variant.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <span className="font-display text-2xl">{product.name.slice(0, 1)}</span>
          </div>
        )}

        {compareAt && compareAt > amount && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink-900 backdrop-blur">
            Save {Math.round(((compareAt - amount) / compareAt) * 100)}%
          </span>
        )}

        {!soldOut && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-300 ease-out-expo group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 max-md:pointer-events-auto max-md:translate-y-0 max-md:opacity-100">
            <button
              type="button"
              onClick={handleQuickAdd}
              className="h-10 w-full rounded-full bg-ink-900/95 text-xs font-medium text-ink-50 shadow-lg backdrop-blur transition-all duration-200 ease-out-expo hover:bg-ink-900 active:scale-[0.97]"
            >
              Quick add
            </button>
          </div>
        )}

        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink-900/80 px-2 py-0.5 text-[11px] font-medium text-ink-50">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-ink-900">{product.name}</h3>
          {variant.name && variant.name !== 'Default' && (
            <p className="mt-0.5 text-xs text-ink-500">{variant.name}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-ink-900">
            {formatPrice(amount, currency)}
            {isRecurring && <span className="text-xs font-normal text-ink-400"> /mo</span>}
          </p>
          {compareAt && compareAt > amount && (
            <p className="text-xs text-ink-400 line-through">{formatPrice(compareAt, currency)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
