/**
 * FRONTEND — browser-only code.
 * Tokenizes the card with @tagadapay/core-js, then calls YOUR backend API.
 * Never put your CRM API key here.
 */
import { useCallback, useEffect, useState } from 'react';
import { useCardTokenization } from '@tagadapay/core-js/react';

interface AppConfig {
  storeId: string;
  planName: string;
  planAmount: number;
  planCurrency: string;
  priceId: string;
  paymentFlowId?: string;
  tpaId?: string;
}

interface FlowProcessor {
  processorId: string;
  weight?: number;
  orderIndex?: number;
}

interface PaymentFlowInfo {
  id: string;
  name: string;
  strategy: string;
  processorConfigs: FlowProcessor[];
  fallbackProcessorConfigs: FlowProcessor[];
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [flow, setFlow] = useState<PaymentFlowInfo | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('demo@my-saas.com');
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Founder');
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiry, setExpiry] = useState('12/30');
  const [cvc, setCvc] = useState('123');

  const append = useCallback((line: string, cls = '') => {
    setLog((prev) => [...prev, cls ? `<${cls}>${line}` : line]);
  }, []);

  const { tokenizeCard, isLoading: tokenizing } = useCardTokenization({
    environment: 'production',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/config').then((r) => r.json()),
      fetch('/api/payment-flow').then((r) => (r.ok ? r.json() : null)),
    ]).then(([cfg, flowData]) => {
      setConfig(cfg);
      if (flowData?.flow) setFlow(flowData.flow);
    });
  }, []);

  async function subscribe() {
    if (!config?.storeId || !config.priceId) {
      append('Missing storeId or priceId — run pnpm seed on the server', 'err');
      return;
    }

    setLoading(true);
    setLog([]);

    try {
      // ── FRONTEND: tokenize card (PCI-safe, never hits your server as PAN) ──
      append('1. Tokenize card (@tagadapay/core-js)', 'step');
      const { tagadaToken } = await tokenizeCard({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate: expiry,
        cvc,
        cardholderName: `${firstName} ${lastName}`,
      });
      append('   tagadaToken created (send to backend only)', 'ok');

      // ── BACKEND: create customer ──
      append('2. Create customer (node-sdk / server)', 'step');
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: config.storeId,
          email,
          firstName,
          lastName,
        }),
      });
      const { customer } = await custRes.json();
      append(`   customer ${customer.id}`, 'ok');

      // ── BACKEND: vault card as payment instrument ──
      append('3. Vault card → payment instrument (node-sdk / server)', 'step');
      const piRes = await fetch('/api/payment-instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagadaToken,
          storeId: config.storeId,
          customerData: { email, firstName, lastName },
        }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error);
      const instrument = piData.paymentInstrument;
      append(`   instrument ${instrument.id} (•••• ${instrument.card?.last4})`, 'ok');

      // ── BACKEND: charge via payment flow (cascade across processors) ──
      append('4. Charge via payment flow (node-sdk / server)', 'step');
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: config.planAmount,
          currency: config.planCurrency,
          storeId: config.storeId,
          paymentInstrumentId: instrument.id,
          customerId: customer.id,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);
      const payment = payData.payment;
      append(`   payment ${payment.id} → ${payment.status}`, payment.status === 'succeeded' ? 'ok' : 'err');

      if (payment.status !== 'succeeded') {
        throw new Error(`Payment ${payment.status}`);
      }

      // ── BACKEND: create subscription ──
      append('5. Create subscription (node-sdk / server)', 'step');
      const subRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          priceId: config.priceId,
          storeId: config.storeId,
          currency: config.planCurrency,
          defaultPaymentInstrumentId: instrument.id,
          paymentId: payment.id,
        }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error);
      const sub = subData.subscription;
      append(`   subscription ${sub.id} → ${sub.status}`, 'ok');
      append(`   next billing: ${sub.nextBillingDate}`, 'ok');
      append('\nDone. Card vaulted once — rebills route through your payment flow.', 'ok');
    } catch (err) {
      append(`Error: ${err instanceof Error ? err.message : String(err)}`, 'err');
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || tokenizing;

  return (
    <div className="layout">
      <header>
        <h1>TagadaPay SaaS Billing</h1>
        <p>
          Processor-agnostic subscriptions — one vault, many TPAs/processors, orchestrated by payment flows.
        </p>
      </header>

      <div className="grid">
        <div className="card">
          <h2>
            <span className="badge badge-frontend">Frontend</span> Subscribe
          </h2>
          {config && (
            <div className="plan-price">
              {formatAmount(config.planAmount, config.planCurrency)}
              <span> / month</span>
            </div>
          )}
          <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {config?.planName ?? 'Pro'} plan
          </p>

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="row">
            <div>
              <label>First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label>Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <label>Card number</label>
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />

          <div className="row">
            <div>
              <label>Expiry (MM/YY)</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <div>
              <label>CVC</label>
              <input value={cvc} onChange={(e) => setCvc(e.target.value)} />
            </div>
          </div>

          <button onClick={subscribe} disabled={busy}>
            {busy ? 'Processing…' : 'Subscribe'}
          </button>
        </div>

        <div className="card">
          <h2>
            <span className="badge badge-backend">Backend</span> Payment flow
          </h2>
          {flow ? (
            <>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{flow.name}</strong> — strategy: <code>{flow.strategy}</code>
              </p>
              <ul className="flow-list">
                {flow.processorConfigs?.map((pc) => (
                  <li key={pc.processorId}>
                    <span>Primary</span>
                    <code>{pc.processorId}</code>
                  </li>
                ))}
                {flow.fallbackProcessorConfigs?.map((pc) => (
                  <li key={pc.processorId}>
                    <span>Fallback #{pc.orderIndex ?? 0}</span>
                    <code>{pc.processorId}</code>
                  </li>
                ))}
              </ul>
              {config?.tpaId && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                  Live TPA: <code>{config.tpaId}</code>
                </p>
              )}
            </>
          ) : (
            <p style={{ color: '#64748b' }}>Run <code>pnpm seed</code> to create a cascade flow.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Flow log</h2>
        <div className="log">
          {log.length === 0
            ? 'Click Subscribe to run the full SaaS billing flow.'
            : log.map((line, i) => {
                const cls = line.startsWith('<ok>') ? 'ok' : line.startsWith('<err>') ? 'err' : line.startsWith('<step>') ? 'step' : '';
                const text = line.replace(/^<(ok|err|step)>/, '');
                return (
                  <div key={i} className={cls}>
                    {text}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
