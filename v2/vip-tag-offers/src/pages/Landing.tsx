import { useState } from 'react';
import { useCheckout } from '@tagadapay/headless-sdk/react';
import { EXAMPLE_REPO_URL, TEE_VARIANT_ID, TUTORIAL_URL } from '../lib/config';
import { getTags, setTags } from '../lib/tags';

type Persona = 'new' | 'vip';

const PERSONAS: Array<{ id: Persona; label: string; offer: string }> = [
  { id: 'new', label: '🆕 New customer', offer: 'Welcome Cap $14.99' },
  { id: 'vip', label: '⭐ VIP member (tag: vip)', offer: 'Members Hoodie $39' },
];

/**
 * Landing CTA + persona simulator. The toggle stands in for real CRM
 * tags so you can walk both branches from one browser.
 */
export function Landing() {
  const { createSessionUrl } = useCheckout(null);
  const [persona, setPersona] = useState<Persona>(getTags().includes('vip') ? 'vip' : 'new');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (next: Persona) => {
    setTags(next === 'vip' ? ['vip'] : []);
    setPersona(next);
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

  const active = PERSONAS.find((p) => p.id === persona) ?? PERSONAS[0];

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
          <p className="eyebrow">Same tee, tag-routed post-purchase offer</p>
          <h1>Essential Tee</h1>
          <p className="lede">
            $29.99. Everyone buys the same tee — the one-click offer after payment depends on
            the customer's CRM tags. Pick a persona to walk that branch.
          </p>

          <div className="chips" role="radiogroup" aria-label="Simulated customer persona">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip${p.id === persona ? ' chip-active' : ''}`}
                onClick={() => pick(p.id)}
              >
                {p.label}
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
              github.com/TagadaPay/examples/vip-tag-offers
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
