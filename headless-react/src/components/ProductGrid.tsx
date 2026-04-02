import { useEffect } from 'react';
import { useCatalog, useAnalytics } from '@tagadapay/headless-sdk/react';
import type { CatalogVariant, CatalogProduct } from '@tagadapay/headless-sdk';
import type { CartItem } from '../App';

interface ProductGridProps {
  cart: CartItem[];
  onAddToCart: (variant: CatalogVariant, productName: string) => void;
  onGoToCart: () => void;
  cartCount: number;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getVariantPrice(variant: CatalogVariant): { amount: number; compareAt?: number; currency: string } {
  const defaultPrice = variant.prices?.find((p) => p.default) ?? variant.prices?.[0];
  const currency = variant.currency ?? 'USD';

  if (defaultPrice?.currencyOptions) {
    const opt = defaultPrice.currencyOptions[currency]
      ?? defaultPrice.currencyOptions[Object.keys(defaultPrice.currencyOptions)[0]];
    if (opt) {
      return { amount: opt.amount, compareAt: opt.compareAtAmount, currency };
    }
  }

  return { amount: variant.price ?? 0, compareAt: variant.compareAtPrice ?? undefined, currency };
}

function ProductCard({
  product,
  cartItem,
  onAdd,
}: {
  product: CatalogProduct;
  cartItem?: CartItem;
  onAdd: (variant: CatalogVariant, productName: string) => void;
}) {
  const variant = product.variants?.[0];
  if (!variant) return null;

  const { amount, compareAt, currency } = getVariantPrice(variant);

  return (
    <div className="group card-dark overflow-hidden transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
      {variant.imageUrl ? (
        <div className="relative aspect-square overflow-hidden bg-white/5">
          <img
            src={variant.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {cartItem && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {cartItem.quantity}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
          <svg className="h-10 w-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          {cartItem && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {cartItem.quantity}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <h3 className="text-sm font-semibold text-white/90 line-clamp-1">{product.name}</h3>
        {product.variants.length > 1 && (
          <p className="mt-0.5 text-xs text-white/30">{product.variants.length} variants</p>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-white">{formatPrice(amount, currency)}</span>
          {compareAt && compareAt > amount && (
            <span className="text-xs text-white/30 line-through">{formatPrice(compareAt, currency)}</span>
          )}
        </div>

        <button
          onClick={() => onAdd(variant, product.name)}
          className="btn-primary mt-3 w-full py-2 text-xs"
        >
          {cartItem ? `Add Another` : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export function ProductGrid({ cart, onAddToCart, onGoToCart, cartCount }: ProductGridProps) {
  const { products, isLoading, error, loadProducts } = useCatalog();
  const { trackPageView, trackViewContent } = useAnalytics();

  useEffect(() => {
    loadProducts();
    trackPageView('products');
  }, [loadProducts, trackPageView]);

  useEffect(() => {
    if (products.length > 0) {
      trackViewContent({ value: products.length });
    }
  }, [products, trackViewContent]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-dark overflow-hidden">
              <div className="aspect-square animate-shimmer bg-white/5" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-shimmer rounded bg-white/5" />
                <div className="h-5 w-1/2 animate-shimmer rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-dark border-red-500/20 p-8 text-center">
        <p className="text-sm text-red-400">Failed to load products</p>
        <p className="mt-1 text-xs text-white/30">{error.message}</p>
        <button onClick={() => loadProducts()} className="btn-primary mt-4 px-6 py-2 text-xs">
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="card-dark p-8 text-center">
        <p className="text-sm text-white/50">No products found for this store</p>
        <p className="mt-1 text-xs text-white/30">Make sure your Store ID is correct and has active products.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">{products.length} Products</h2>
        {cartCount > 0 && (
          <button onClick={onGoToCart} className="btn-primary flex items-center gap-2 py-2 text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V5.632c0-.724-.49-1.359-1.196-1.442A49.007 49.007 0 0 0 7.5 3.78" />
            </svg>
            Cart ({cartCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cartItem={cart.find((item) => item.variantId === product.variants?.[0]?.id)}
            onAdd={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
