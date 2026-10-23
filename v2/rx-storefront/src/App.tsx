import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import { ENVIRONMENT, STORE_ID } from './lib/config';
import { Landing } from './pages/Landing';
import { Quiz } from './pages/Quiz';
import { Checkout } from './pages/Checkout';
import { Offer } from './pages/Offer';
import { ThankYou } from './pages/ThankYou';
import { Portal } from './pages/Portal';

/**
 * Six routes = the Tagada Rx Funnel v2 graph that `pnpm seed` installs
 * in the CRM. Tagada does not move the shopper — this router does.
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
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/offer" element={<Offer />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/portal/*" element={<Portal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TagadaHeadlessProvider>
  );
}
