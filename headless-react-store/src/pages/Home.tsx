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
              <a
                href="#shop"
                className="inline-flex h-12 items-center rounded-full bg-ink-900 px-6 text-sm font-medium text-ink-50 transition hover:bg-ink-800"
              >
                Shop the collection
              </a>
              <a
                href="https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-ink-300 bg-transparent px-6 text-sm font-medium text-ink-800 transition hover:bg-white"
              >
                Fork this template
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-200">
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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem title="Free shipping" body="On orders over $50 in the US." />
          <TrustItem title="30-day returns" body="No questions asked. Easy returns." />
          <TrustItem title="Secure payments" body="3DS, PCI-DSS L1, multi-PSP routing." />
        </div>
      </section>
    </>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-medium text-ink-900">{title}</p>
      <p className="mt-1 text-ink-500">{body}</p>
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
