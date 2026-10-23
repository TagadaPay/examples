import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRx } from '@tagadapay/headless-sdk/react';
import { PRODUCT_ID } from '../lib/config';

/**
 * Medical intake lives here — after payment. Fetch the network questionnaire,
 * collect answers in memory, submitCase, then poll status.
 */
export function ThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const checkoutToken = params.get('checkoutToken') ?? '';
  const rx = useRx();
  const [required, setRequired] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dob, setDob] = useState('1990-04-12');
  const [sex, setSex] = useState<'female' | 'male' | 'unspecified'>('female');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!PRODUCT_ID) {
      setRequired(false);
      return;
    }
    void rx.isRequiredForProduct(PRODUCT_ID).then((check) => {
      setRequired(check.required);
      if (check.required) {
        void rx.getQuestionsForProduct(PRODUCT_ID).then((qs) => {
          const next: Record<string, string> = {};
          for (const question of qs.questions) next[question.externalQuestionId] = '';
          setAnswers(next);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PRODUCT_ID]);

  useEffect(() => {
    if (!submitted || !orderId || !checkoutToken) return;
    const stop = rx.pollOrder({ orderId, checkoutToken });
    return () => {
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, orderId, checkoutToken]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!orderId || !checkoutToken || !PRODUCT_ID) {
      setError('Missing orderId, checkoutToken, or product id.');
      return;
    }
    setError(null);
    try {
      await rx.submitCase({
        orderId,
        checkoutToken,
        productId: PRODUCT_ID,
        patient: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@tgdcare.com',
          dateOfBirth: dob,
          sexAtBirth: sex,
          address: {
            line1: '1 Main St',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            country: 'US',
          },
        },
        intakeAnswers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'submitCase failed — activate Tagada Rx on this store to send a real case.',
      );
    }
  };

  if (!orderId) {
    return (
      <main className="page">
        <div className="card">
          <h1>Missing order</h1>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  const status = rx.cases[0]?.status;

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Harbor Clinic
        </Link>
        <span>Thank you</span>
      </header>

      <div className="card">
        <p className="eyebrow">Step 5 of 6</p>
        <h1>Payment received</h1>
        <p className="hint">
          Payment is not medical approval. A licensed clinician reviews the
          intake and may decline — in that case the order is refunded.
        </p>

        {required === false && (
          <p>
            This product is not mapped to an Rx offering, so there is no intake
            to collect. The Funnel v2 still has this box. Map a product with the
            Node SDK to see <code>getQuestionsForProduct</code> here.
          </p>
        )}

        {required && !submitted && (
          <form onSubmit={(event) => void submit(event)}>
            <h2>Medical intake</h2>
            <label>
              Date of birth
              <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
            </label>
            <label>
              Sex assigned at birth
              <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unspecified">Prefer not to say</option>
              </select>
            </label>
            {Object.keys(answers).map((id) => (
              <label key={id}>
                {id}
                <input
                  value={answers[id]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [id]: e.target.value }))}
                />
              </label>
            ))}
            <button className="btn" type="submit" disabled={rx.isLoading}>
              {rx.isLoading ? 'Sending…' : 'Send to clinician'}
            </button>
          </form>
        )}

        {submitted && <p>{status ? `Case status: ${status}` : 'Submitted — waiting for the clinician.'}</p>}

        {error ? <p className="error">{error}</p> : null}

        <p>
          <Link to="/portal">Open patient portal</Link>
        </p>
      </div>
    </main>
  );
}
