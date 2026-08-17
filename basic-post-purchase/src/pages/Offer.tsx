import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useOffers } from '@tagadapay/headless-sdk/react';

type OfferPageProps = {
  offerId: string;
  title: string;
  priceLabel: string;
  acceptPath: string;
  declinePath: string;
};

/**
 * One-click OTO. Accept charges the card from the main order.
 * Decline is just navigation — no API call.
 */
export function Offer({ offerId, title, priceLabel, acceptPath, declinePath }: OfferPageProps) {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const go = (path: string) => {
    if (!orderId) return;
    navigate(`${path}?orderId=${encodeURIComponent(orderId)}`);
  };

  const { processOfferPayment, isLoading } = useOffers({
    onOfferAccepted: () => go(acceptPath),
    onOfferDeclined: (result) => {
      setError(result.error || 'Offer payment failed.');
    },
  });

  const accept = async () => {
    if (!orderId || !offerId) {
      setError('Missing order or offer id. Run pnpm seed and start from the landing.');
      return;
    }
    setError(null);
    const result = await processOfferPayment({
      offerId,
      mainOrderId: orderId,
      returnUrl: window.location.href,
    });
    if (result.status === 'succeeded') {
      go(acceptPath);
    } else if (result.status === 'failed') {
      setError(result.error || 'Offer payment failed.');
    }
  };

  if (!orderId) {
    return (
      <main className="page">
        <div className="card">
          <h1>Missing order</h1>
          <p>This page needs ?orderId= from checkout.</p>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <span className="brand">Showcase</span>
        <span>One-click offer</span>
      </header>
      <div className="card offer">
        <p className="eyebrow">Add to your order</p>
        <h1>{title}</h1>
        <p className="price">{priceLabel}</p>
        <p>Charged on the same card. You can skip — we will not charge you.</p>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button type="button" className="btn" disabled={isLoading} onClick={() => void accept()}>
            {isLoading ? 'Adding…' : `Yes — add for ${priceLabel}`}
          </button>
          <button type="button" className="btn btn-ghost" disabled={isLoading} onClick={() => go(declinePath)}>
            No thanks
          </button>
        </div>
      </div>
    </main>
  );
}
