import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '@tagadapay/headless-sdk/react';
import type { CatalogProduct, CatalogVariant } from '@tagadapay/headless-sdk';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/format';

export function Product() {
  const { variantId } = useParams<{ variantId: string }>();
  const { products, isLoading, loadProducts } = useCatalog();
  const { addLine } = useCart();

  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (products.length === 0) loadProducts();
  }, [loadProducts, products.length]);

  const match = useMemo(() => {
    if (!variantId) return null;
    for (const product of products) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (variant) return { product, variant };
    }
    return null;
  }, [products, variantId]);

  if (!variantId) {
    return <NotFound />;
  }

  if (isLoading && !match) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-ink-100" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-ink-100" />
            <div className="h-10 w-2/3 animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-ink-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!match) return <NotFound />;

  return (
    <ProductDetail
      product={match.product}
      variant={match.variant}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAdd={() => {
        const price = match.variant.prices?.find((p) => p.default) ?? match.variant.prices?.[0];
        const currency = match.variant.currency ?? 'USD';
        const opt = price?.currencyOptions?.[currency] ??
          (price?.currencyOptions ? price.currencyOptions[Object.keys(price.currencyOptions)[0]] : undefined);

        addLine({
          variantId: match.variant.id,
          priceId: price?.id,
          productName: match.product.name,
          variantName: match.variant.name,
          price: opt?.amount ?? match.variant.price ?? 0,
          currency,
          imageUrl: match.variant.imageUrl,
          quantity,
        });

        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      added={added}
    />
  );
}

function ProductDetail({
  product,
  variant,
  quantity,
  onQuantityChange,
  onAdd,
  added,
}: {
  product: CatalogProduct;
  variant: CatalogVariant;
  quantity: number;
  onQuantityChange: (n: number) => void;
  onAdd: () => void;
  added: boolean;
}) {
  const price = variant.prices?.find((p) => p.default) ?? variant.prices?.[0];
  const currency = variant.currency ?? 'USD';
  const opt = price?.currencyOptions?.[currency] ??
    (price?.currencyOptions ? price.currencyOptions[Object.keys(price.currencyOptions)[0]] : undefined);
  const amount = opt?.amount ?? variant.price ?? 0;
  const compareAt = variant.compareAtPrice;
  const isRecurring = price?.recurring ?? false;

  return (
    <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <nav className="mb-8 text-xs text-ink-500">
        <Link to="/" className="hover:text-ink-900">Shop</Link>
        <span className="mx-2 text-ink-300">/</span>
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square overflow-hidden rounded-3xl bg-ink-100 lg:sticky lg:top-24 lg:self-start">
          {variant.imageUrl ? (
            <img src={variant.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-7xl text-ink-300">
              {product.name.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="animate-slide-up">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-medium text-ink-900">
              {formatPrice(amount, currency)}
              {isRecurring && <span className="text-base font-normal text-ink-400"> /month</span>}
            </span>
            {compareAt && compareAt > amount && (
              <>
                <span className="text-lg text-ink-400 line-through">{formatPrice(compareAt, currency)}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  Save {Math.round(((compareAt - amount) / compareAt) * 100)}%
                </span>
              </>
            )}
          </div>

          {(product.description || variant.description) && (
            <p className="mt-6 max-w-prose text-base leading-relaxed text-ink-600">
              {variant.description || product.description}
            </p>
          )}

          {/* Quantity stepper */}
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-ink-700">Quantity</p>
            <div className="mt-2 inline-flex h-12 items-center rounded-full border border-ink-300 bg-white">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-l-full text-ink-600 transition hover:bg-ink-100 disabled:opacity-30"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-r-full text-ink-600 transition hover:bg-ink-100"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
              disabled={!variant.inStock}
            >
              {!variant.inStock ? 'Sold out' : added ? 'Added to cart ✓' : 'Add to cart'}
            </button>
            <Link
              to="/cart"
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink-300 bg-transparent px-6 text-sm font-medium text-ink-800 transition hover:bg-white"
            >
              View cart
            </Link>
          </div>

          {/* Details strip */}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink-200 pt-8 text-sm">
            <Detail label="SKU" value={variant.sku ?? '—'} />
            <Detail label="In stock" value={variant.inStock ? 'Yes' : 'No'} />
            <Detail label="Currency" value={currency} />
            <Detail label="Billing" value={isRecurring ? `Every ${price?.intervalCount ?? 1} ${price?.interval ?? 'month'}` : 'One-time'} />
          </dl>
        </div>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-widest text-ink-400">{label}</dt>
      <dd className="mt-1 text-ink-800">{value}</dd>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-3xl text-ink-900">Product not found</p>
      <p className="mt-2 text-ink-500">It may have been removed or never existed.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-900 px-5 text-sm font-medium text-ink-50 hover:bg-ink-800"
      >
        Back to shop
      </Link>
    </div>
  );
}
