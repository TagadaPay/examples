import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { parseTokensFromUrl } from '@tagadapay/headless-sdk';
import { useCheckout, usePayment } from '@tagadapay/headless-sdk/react';
import { formatPrice } from '../lib/format';

/**
 * Self-hosted checkout. Tokens come from `createSessionUrl` on the landing.
 * On success we go to /offer?orderId= — not thank-you — so the OTOs run.
 */
export function Checkout() {
  const [params] = useSearchParams();
  const isRedirectReturn =
    params.get('paymentAction') === 'requireAction' && !!params.get('paymentId');

  if (isRedirectReturn) return <CheckoutResume />;

  const tokens = parseTokensFromUrl();
  if (!tokens) {
    return (
      <main className="page">
        <div className="card">
          <h1>No checkout session</h1>
          <p>Start from the landing so the cart has the tee.</p>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  return <CheckoutForm checkoutToken={tokens.checkoutToken} sessionToken={tokens.sessionToken} />;
}

function CheckoutResume() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState<string | null>(null);

  usePayment({
    onPaymentSuccess: (result) => {
      const orderId = result.order?.id;
      if (!orderId) {
        setFailed('Payment succeeded but no order id came back.');
        return;
      }
      navigate(`/offer?orderId=${encodeURIComponent(orderId)}`, { replace: true });
    },
    onPaymentFailed: (result) => {
      setFailed(result.error || 'Payment could not be completed.');
    },
  });

  return (
    <main className="page">
      <div className="card">
        {failed ? (
          <>
            <h1>Payment not completed</h1>
            <p className="error">{failed}</p>
            <Link className="btn" to="/">
              Back to landing
            </Link>
          </>
        ) : (
          <>
            <h1>Finalizing…</h1>
            <p>Hang tight — this only takes a moment.</p>
          </>
        )}
      </div>
    </main>
  );
}

function CheckoutForm({
  checkoutToken,
  sessionToken,
}: {
  checkoutToken: string;
  sessionToken?: string;
}) {
  const navigate = useNavigate();
  const {
    session,
    isLoading,
    updateCustomerAndAddress,
    getShippingRates,
    selectShippingRate,
  } = useCheckout(checkoutToken, sessionToken);

  const { loadPaymentSetup, tokenizeCard, processPayment, isProcessing } = usePayment({
    onPaymentSuccess: (result) => {
      const orderId = result.order?.id;
      if (orderId) {
        navigate(`/offer?orderId=${encodeURIComponent(orderId)}`, { replace: true });
      }
    },
  });

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [line1, setLine1] = useState('123 Market St');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('94103');
  const [country, setCountry] = useState('US');
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiryDate, setExpiryDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'paying'>('idle');

  useEffect(() => {
    if (session?.id) void loadPaymentSetup(session.id);
  }, [loadPaymentSetup, session?.id]);

  const pay = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.id) return;
    setError(null);
    setStage('paying');
    try {
      await updateCustomerAndAddress({
        customer: { email, firstName, lastName },
        shippingAddress: {
          firstName,
          lastName,
          line1,
          city,
          state,
          postalCode,
          country,
        },
        billingAddress: {
          firstName,
          lastName,
          line1,
          city,
          state,
          postalCode,
          country,
        },
      });

      const rates = await getShippingRates();
      if (rates.length && !session.selectedShippingRateId) {
        await selectShippingRate(rates[0].id);
      }

      const { tagadaToken } = await tokenizeCard({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate: expiryDate.replace(/\s/g, ''),
        cvc,
        cardholderName: cardName || `${firstName} ${lastName}`.trim(),
      });

      const result = await processPayment({
        checkoutSessionId: session.id,
        tagadaToken,
      });

      if (result.status === 'failed') {
        setError(result.error || 'Payment failed.');
        setStage('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('idle');
    }
  };

  if (isLoading && !session) {
    return (
      <main className="page">
        <p>Loading checkout…</p>
      </main>
    );
  }

  const total = session?.totals?.total ?? 0;
  const currency = session?.totals?.currency ?? 'USD';

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Showcase
        </Link>
        <span>Checkout</span>
      </header>

      <form className="checkout" onSubmit={(event) => void pay(event)}>
        <div className="card">
          <h2>Contact</h2>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="row">
            <label>
              First name
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label>
              Last name
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>

          <h2>Shipping</h2>
          <label>
            Address
            <input required value={line1} onChange={(e) => setLine1(e.target.value)} />
          </label>
          <div className="row">
            <label>
              City
              <input required value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label>
              State
              <input required value={state} onChange={(e) => setState(e.target.value)} />
            </label>
            <label>
              ZIP
              <input required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </label>
          </div>
          <label>
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="FR">France</option>
            </select>
          </label>

          <h2>Card</h2>
          <p className="hint">Sandbox: 4242 4242 4242 4242 · 12/28 · 123</p>
          <label>
            Card number
            <input
              required
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </label>
          <div className="row">
            <label>
              Expiry (MM/YY)
              <input required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </label>
            <label>
              CVC
              <input required value={cvc} onChange={(e) => setCvc(e.target.value)} />
            </label>
          </div>
          <label>
            Name on card
            <input value={cardName} onChange={(e) => setCardName(e.target.value)} />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn" type="submit" disabled={stage === 'paying' || isProcessing}>
            {stage === 'paying' || isProcessing
              ? 'Paying…'
              : `Pay ${formatPrice(total, currency)}`}
          </button>
        </div>

        <aside className="card summary">
          <h2>Order</h2>
          <ul>
            {(session?.items ?? []).map((item) => (
              <li key={`${item.variantId}-${item.quantity}`}>
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.totalAmount, item.currency)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </form>
    </main>
  );
}
