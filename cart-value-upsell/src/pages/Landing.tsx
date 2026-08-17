import { useState } from 'react';
import { useCheckout } from '@tagadapay/headless-sdk/react';
import { EXAMPLE_REPO_URL, TEE_VARIANT_ID, TUTORIAL_URL } from '../lib/config';

const PACKS = [
  { qty: 1, label: '1 tee — $29.99', offer: 'Crew Socks $9 (easy add-on)' },
  { qty: 2, label: '2 tees — $59.98', offer: 'Heavyweight Hoodie $39 (premium)' },
];

/**
 * Landing CTA with two cart sizes. This signal is real — the checkout
 * total decides which upsell the shopper sees after payment.
 */
export function Landing() {
  const { createSessionUrl } = useCheckout(null);
  const [qty, setQty] = useState(1);
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
        items: [{ variantId: TEE_VARIANT_ID, quantity: qty }],
        currency: 'USD',
        checkoutPath: '/checkout',
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setBusy(false);
    }
  };

  const active = PACKS.find((p) => p.qty === qty) ?? PACKS[0];

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
          <p className="eyebrow">Cart value picks the post-purchase offer</p>
          <h1>Essential Tee</h1>
          <p className="lede">
            Orders of $50 or more get the premium hoodie upsell. Smaller orders get a $9
            add-on instead — an easy yes that still lifts AOV. Pick a cart size and try both.
          </p>

          <div className="chips" role="radiogroup" aria-label="Cart size">
            {PACKS.map((p) => (
              <button
                key={p.qty}
                type="button"
                className={`chip${p.qty === qty ? ' chip-active' : ''}`}
                onClick={() => setQty(p.qty)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="hint">
            After checkout you will see: <strong>{active.offer}</strong>
          </p>

          <button type="button" className="btn" onClick={() => void buy()} disabled={busy}>
            {busy ? 'Opening checkout…' : `Buy now — $${(qty * 29.99).toFixed(2)}`}
          </button>
          {error ? <p className="error">{error}</p> : null}
          <p className="hint">
            Source:{' '}
            <a href={EXAMPLE_REPO_URL} target="_blank" rel="noreferrer">
              github.com/TagadaPay/examples/cart-value-upsell
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
