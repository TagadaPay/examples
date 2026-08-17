import { useState } from 'react';
import { useCheckout } from '@tagadapay/headless-sdk/react';
import { EXAMPLE_REPO_URL, TEE_VARIANT_ID, TUTORIAL_URL } from '../lib/config';
import { getRegion, setRegion, type Region } from '../lib/region';

const REGIONS: Array<{ id: Region; label: string; offer: string }> = [
  { id: 'us', label: '🇺🇸 United States', offer: 'Varsity Cap $19.99' },
  { id: 'eu', label: '🇪🇺 Europe', offer: 'Alpine Beanie $17.99' },
  { id: 'row', label: '🌍 Rest of world', offer: 'Travel Tote $24' },
];

/**
 * Landing CTA + region simulator. The chips stand in for real geo
 * detection so you can walk all three branches from one browser.
 */
export function Landing() {
  const { createSessionUrl } = useCheckout(null);
  const [region, setRegionState] = useState<Region>(getRegion());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (next: Region) => {
    setRegion(next);
    setRegionState(next);
  };

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

  const active = REGIONS.find((r) => r.id === region) ?? REGIONS[2];

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
          <p className="eyebrow">Same tee, geo-routed post-purchase offer</p>
          <h1>Essential Tee</h1>
          <p className="lede">
            $29.99. Everyone buys the same tee — the one-click offer after payment depends on
            where the visitor is. Pick a region to walk that branch.
          </p>

          <div className="chips" role="radiogroup" aria-label="Simulated visitor region">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`chip${r.id === region ? ' chip-active' : ''}`}
                onClick={() => pick(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="hint">
            After checkout you will see: <strong>{active.offer}</strong>
          </p>

          <button type="button" className="btn" onClick={() => void buy()} disabled={busy}>
            {busy ? 'Opening checkout…' : 'Buy now — $29.99'}
          </button>
          {error ? <p className="error">{error}</p> : null}
          <p className="hint">
            Source:{' '}
            <a href={EXAMPLE_REPO_URL} target="_blank" rel="noreferrer">
              github.com/TagadaPay/examples/geo-offers
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
