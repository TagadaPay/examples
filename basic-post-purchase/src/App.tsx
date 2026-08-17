import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import {
  CAP_DOWNSELL_OFFER_ID,
  CAP_OFFER_ID,
  ENVIRONMENT,
  STORE_ID,
  TOTE_OFFER_ID,
} from './lib/config';
import { Landing } from './pages/Landing';
import { Checkout } from './pages/Checkout';
import { Offer } from './pages/Offer';
import { ThankYou } from './pages/ThankYou';

/**
 * Six routes = the basic post-purchase graph.
 * Tagada does not move the shopper — this router does.
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
          <Route
            path="/offer"
            element={
              <Offer
                offerId={CAP_OFFER_ID}
                title="Add the Essential Cap"
                priceLabel="$19.99"
                acceptPath="/offer-tote"
                declinePath="/downsell"
              />
            }
          />
          <Route
            path="/downsell"
            element={
              <Offer
                offerId={CAP_DOWNSELL_OFFER_ID}
                title="Last chance — cap at $14.99"
                priceLabel="$14.99"
                acceptPath="/offer-tote"
                declinePath="/thank-you"
              />
            }
          />
          <Route
            path="/offer-tote"
            element={
              <Offer
                offerId={TOTE_OFFER_ID}
                title="Add the Essential Tote"
                priceLabel="$24.00"
                acceptPath="/thank-you"
                declinePath="/thank-you"
              />
            }
          />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TagadaHeadlessProvider>
  );
}
