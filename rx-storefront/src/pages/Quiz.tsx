import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '@tagadapay/headless-sdk/react';
import { VARIANT_ID } from '../lib/config';

/**
 * Marketing quiz — goals / preferences only. No medical questions.
 * Answers stay in the session and pick the product; they are not PHI.
 */
export function Quiz() {
  const navigate = useNavigate();
  const { createSessionUrl } = useCheckout(null);
  const [goal, setGoal] = useState<'hair' | 'weight' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueToCheckout = async () => {
    if (!goal) {
      setError('Pick a goal first.');
      return;
    }
    if (!VARIANT_ID) {
      setError('Missing VITE_VARIANT_ID — run pnpm seed and restart.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await createSessionUrl({
        items: [{ variantId: VARIANT_ID, quantity: 1 }],
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
        <Link to="/" className="brand">
          Harbor Clinic
        </Link>
        <span>Marketing quiz</span>
      </header>

      <div className="card">
        <p className="eyebrow">Step 2 of 6</p>
        <h1>What are you here for?</h1>
        <p className="hint">
          Qualification only — no medical questions. The clinician questionnaire
          comes after payment on thank-you.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={() => setGoal('hair')}>
            {goal === 'hair' ? '✓ Hair' : 'Hair'}
          </button>
          <button type="button" className="btn" onClick={() => setGoal('weight')}>
            {goal === 'weight' ? '✓ Weight' : 'Weight'}
          </button>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => void continueToCheckout()}
          disabled={busy}
        >
          {busy ? 'Opening checkout…' : 'Continue to checkout'}
        </button>
        {error ? <p className="error">{error}</p> : null}
        <p>
          <button type="button" onClick={() => navigate('/')}>
            Back
          </button>
        </p>
      </div>
    </main>
  );
}
