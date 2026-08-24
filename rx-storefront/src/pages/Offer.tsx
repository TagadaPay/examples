import { Link, useNavigate, useSearchParams } from 'react-router-dom';

/** Optional post-purchase box. This demo has no SKU to upsell — skip through. */
export function Offer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const checkoutToken = params.get('checkoutToken') ?? '';

  const next = () => {
    const query = new URLSearchParams();
    if (orderId) query.set('orderId', orderId);
    if (checkoutToken) query.set('checkoutToken', checkoutToken);
    navigate(`/thank-you?${query.toString()}`);
  };

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Harbor Clinic
        </Link>
        <span>Offer</span>
      </header>
      <div className="card">
        <p className="eyebrow">Step 4 of 6</p>
        <h1>No add-on on this demo</h1>
        <p className="hint">
          Hosted templates use this box for a post-purchase offer. Continue to
          thank-you for the medical intake.
        </p>
        <button type="button" className="btn" onClick={next}>
          Continue
        </button>
      </div>
    </main>
  );
}
