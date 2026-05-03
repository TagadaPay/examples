import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import { ENVIRONMENT, STORE_ID } from './lib/config';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { ThankYou } from './pages/ThankYou';

/**
 * Root app: wraps everything in `TagadaHeadlessProvider` so any descendant
 * component can call `useCatalog()`, `useCheckout()`, `usePayment()`, etc.
 */
export default function App() {
  return (
    <TagadaHeadlessProvider storeId={STORE_ID} environment={ENVIRONMENT}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:variantId" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you/:orderId" element={<ThankYou />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TagadaHeadlessProvider>
  );
}

function About() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight text-ink-900">About</h1>
      <p className="mt-6 text-ink-600">
        This is a demo storefront built on the{' '}
        <a className="underline" href="https://tagada.io" target="_blank" rel="noopener noreferrer">
          TagadaPay
        </a>{' '}
        Headless SDK. Every pixel — header to checkout — is yours to fork and rebrand.
      </p>
      <p className="mt-3 text-ink-600">
        Replace the products in <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">scripts/seed.ts</code>,
        adjust the brand in <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">src/lib/config.ts</code>,
        and ship.
      </p>
    </section>
  );
}

function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-400">404</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-ink-900">Page not found</h1>
      <a href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-900 px-5 text-sm font-medium text-ink-50 hover:bg-ink-800">
        Back to shop
      </a>
    </section>
  );
}
