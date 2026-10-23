import { useEffect } from 'react';
import { useCatalog } from '@tagadapay/headless-sdk/react';
import { ProductCard } from '../components/ProductCard';
import { BRAND, STORE_ID } from '../lib/config';

export function Home() {
  const { products, isLoading, error, loadProducts } = useCatalog();

  useEffect(() => {
    if (STORE_ID) loadProducts();
  }, [loadProducts]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-ink-200/60">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="animate-fade-in">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-500">Spring / Summer 26</p>
            <h1 className="mt-3 font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
              Quietly considered.
              <br />
              <span className="text-ink-500">Built to last.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-ink-600">
              {BRAND.tagline} Designed in small batches, shipped from
              the north. Keep the receipts — keep the code.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#shop" className="btn-primary h-12 px-6">
                Shop the collection
              </a>
              <a
                href="https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline h-12 px-6"
              >
                Fork this template
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-200 shadow-sm ring-1 ring-ink-900/5">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=1500&fit=crop&q=80"
              alt="Hero"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-900/20 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section id="shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
              The collection
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {products.length > 0 ? `${products.length} pieces` : 'Curated essentials'}
            </p>
          </div>
        </div>

        {!STORE_ID && <MissingStoreId />}

        {STORE_ID && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-medium">Couldn't load products.</p>
            <p className="mt-1 text-red-700">{error.message}</p>
          </div>
        )}

        {STORE_ID && isLoading && products.length === 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-fade-in">
                <div className="aspect-[4/5] animate-pulse rounded-2xl bg-ink-100" />
                <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-ink-100" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-ink-100" />
              </div>
            ))}
          </div>
        )}

        {STORE_ID && !isLoading && products.length === 0 && !error && (
          <EmptyCatalog />
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="border-t border-ink-200/60 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem
            title="Free shipping"
            body="On orders over $50 in the US."
            icon="M2.25 6.75h9.75v9.75H2.25zM12 9h4.5l3 3v4.5H12zM6 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
          />
          <TrustItem
            title="30-day returns"
            body="No questions asked. Easy returns."
            icon="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
          />
          <TrustItem
            title="Secure payments"
            body="3DS, PCI-DSS L1, multi-PSP routing."
            icon="M12 3 4.5 6v5.25c0 4.28 3.2 8.29 7.5 9.75 4.3-1.46 7.5-5.47 7.5-9.75V6L12 3z"
          />
        </div>
      </section>
    </>
  );
}

function TrustItem({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </span>
      <div>
        <p className="font-medium text-ink-900">{title}</p>
        <p className="mt-1 text-ink-500">{body}</p>
      </div>
    </div>
  );
}

function MissingStoreId() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
      <p className="font-display text-xl text-ink-900">Almost there</p>
      <p className="mt-2 text-sm text-ink-600">
        Set <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">VITE_STORE_ID</code> in
        your <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">.env</code> file to load products.
      </p>
      <p className="mt-2 text-sm text-ink-600">
        The fastest way:{' '}
        <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">pnpm seed YOUR_API_KEY</code>
      </p>
      <p className="mt-3 text-xs text-ink-400">
        Get an API key at{' '}
        <a href="https://app.tagada.io/sign-up?source=examples-headless-react-store" target="_blank" rel="noopener noreferrer" className="underline">
          app.tagada.io
        </a>
      </p>
    </div>
  );
}

function EmptyCatalog() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center">
      <p className="font-display text-xl text-ink-900">No products yet</p>
      <p className="mt-2 text-sm text-ink-500">
        Run <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">pnpm seed YOUR_API_KEY</code> to
        populate this store with demo apparel.
      </p>
    </div>
  );
}
