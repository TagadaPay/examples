import { Link } from 'react-router-dom';
import type { CatalogProduct } from '@tagadapay/headless-sdk';
import { formatPrice } from '../lib/format';

interface ProductCardProps {
  product: CatalogProduct;
}

/**
 * Product tile for the home grid.
 *
 * Picks the default variant + its default price, displays the compare-at as a
 * struck-through reference price when present.
 */
export function ProductCard({ product }: ProductCardProps) {
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

  return (
    <Link
      to={`/product/${variant.id}`}
      className="group block animate-fade-in"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
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
