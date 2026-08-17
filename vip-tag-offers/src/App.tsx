import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import { ENVIRONMENT, STORE_ID } from './lib/config';
import { Landing } from './pages/Landing';
import { Checkout } from './pages/Checkout';
import { TagOffer } from './pages/TagOffer';
import { ThankYou } from './pages/ThankYou';

/**
 * Four routes. /offer is a single route — TagOffer decides which offer to
 * render from the customer's tags, the way a hosted funnel picks an edge.
 */
export default function App() {
  if (!STORE_ID) {
    return (
      <main className="page">
        <div className="card">
          <p className="eyebrow">Setup</p>
          <h1>Missing store id</h1>
          <p>
            Run <code>npx -p @tagadapay/node-sdk tagada-init you@example.com</code> then{' '}
            <code>pnpm seed</code>, and restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TagadaHeadlessProvider storeId={STORE_ID} environment={ENVIRONMENT}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/offer" element={<TagOffer />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TagadaHeadlessProvider>
  );
}
