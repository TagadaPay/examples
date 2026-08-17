import { useState } from 'react';
import { useCheckout } from '@tagadapay/headless-sdk/react';
import { EXAMPLE_REPO_URL, TEE_VARIANT_ID, TUTORIAL_URL } from '../lib/config';

/**
 * Landing CTA. `useCheckout(null)` has no session yet — we only need
 * `createSessionUrl`, then the browser goes to /checkout?checkoutToken=…
 */
export function Landing() {
  const { createSessionUrl } = useCheckout(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    if (!TEE_VARIANT_ID) {
      setError('Missing VITE_TEE_VARIANT_ID — run pnpm seed and restart.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await createSessionUrl({
        items: [{ variantId: TEE_VARIANT_ID, quantity: 1 }],
        currency: 'USD',
        checkoutPath: '/checkout',
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <header className="topbar">
        <span className="brand">Showcase</span>
        <a href={TUTORIAL_URL} target="_blank" rel="noreferrer">
          Tutorial
        </a>
      </header>

      <section className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop&q=80"
          alt="Essential Tee"
        />
        <div className="hero-copy">
          <p className="eyebrow">Landing → checkout → offers → thank you</p>
          <h1>Essential Tee</h1>
          <p className="lede">
            $29.99. After you pay, we offer a cap, a cheaper cap if you decline,
            then a tote. Same graph as the{' '}
            <a href={TUTORIAL_URL} target="_blank" rel="noreferrer">
              basic post-purchase tutorial
            </a>
            .
          </p>
          <button type="button" className="btn" onClick={() => void buy()} disabled={busy}>
            {busy ? 'Opening checkout…' : 'Buy now — $29.99'}
          </button>
          {error ? <p className="error">{error}</p> : null}
          <p className="hint">
            Source:{' '}
            <a href={EXAMPLE_REPO_URL} target="_blank" rel="noreferrer">
              github.com/TagadaPay/examples/basic-post-purchase
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
