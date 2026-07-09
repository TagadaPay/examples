import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Tagada from '@tagadapay/node-sdk';

const PORT = Number(process.env.PORT ?? 3001);
const CRM_KEY = process.env.TAGADA_API_KEY;

if (!CRM_KEY) {
  console.error('Missing TAGADA_API_KEY in .env');
  process.exit(1);
}

const tagada = new Tagada(CRM_KEY);
const app = express();

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

/** GET /api/config — public store config for the frontend */
app.get('/api/config', (_req, res) => {
  res.json({
    storeId: process.env.TAGADA_STORE_ID,
    planName: process.env.SAAS_PLAN_NAME ?? 'Pro',
    planAmount: Number(process.env.SAAS_PLAN_AMOUNT ?? 1900),
    planCurrency: process.env.SAAS_PLAN_CURRENCY ?? 'EUR',
    priceId: process.env.SAAS_PRICE_ID,
    paymentFlowId: process.env.TAGADA_PAYMENT_FLOW_ID,
    tpaId: process.env.TAGADA_TPA_ID,
  });
});

/** GET /api/payment-flow — show how routing is configured (the Stripe-killer feature) */
app.get('/api/payment-flow', async (_req, res) => {
  const flowId = process.env.TAGADA_PAYMENT_FLOW_ID;
  if (!flowId) {
    res.status(404).json({ error: 'TAGADA_PAYMENT_FLOW_ID not set — run pnpm seed first' });
    return;
  }
  const flow = await tagada.paymentFlows.retrieveWithProcessors(flowId);
  res.json({ flow });
});

/** POST /api/payment-instruments — vault card from browser tagadaToken */
app.post('/api/payment-instruments', async (req, res) => {
  try {
    const { tagadaToken, storeId, customerData } = req.body;
    const result = await tagada.paymentInstruments.createFromToken({
      tagadaToken,
      storeId,
      customerData,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payment instrument';
    res.status(400).json({ error: message });
  }
});

/** POST /api/payments — charge through the store's payment flow */
app.post('/api/payments', async (req, res) => {
  try {
    const { amount, currency, storeId, paymentInstrumentId, customerId } = req.body;
    const result = await tagada.payments.process({
      amount,
      currency,
      storeId,
      paymentInstrumentId,
      customerId,
      initiatedBy: 'customer',
      ...(process.env.TAGADA_PAYMENT_FLOW_ID
        ? { paymentFlowId: process.env.TAGADA_PAYMENT_FLOW_ID }
        : {}),
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment failed';
    res.status(400).json({ error: message });
  }
});

/** POST /api/payments/continue — resume after 3DS / Radar */
app.post('/api/payments/continue', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const result = await tagada.payments.continue(paymentId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Continue failed';
    res.status(400).json({ error: message });
  }
});

/** GET /api/payments/:id — poll payment status */
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await tagada.payments.retrieve(req.params.id);
    res.json({ payment });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    res.status(404).json({ error: message });
  }
});

/** POST /api/threeds/sessions — persist 3DS session before charging */
app.post('/api/threeds/sessions', async (req, res) => {
  try {
    const { provider, storeId, paymentInstrumentId, sessionData } = req.body;
    const result = await tagada.threeds.createSession({
      provider,
      storeId,
      paymentInstrumentId,
      sessionData,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '3DS session failed';
    res.status(400).json({ error: message });
  }
});

/** POST /api/subscriptions — create recurring billing after first charge */
app.post('/api/subscriptions', async (req, res) => {
  try {
    const {
      customerId,
      priceId,
      storeId,
      currency,
      defaultPaymentInstrumentId,
      paymentId,
    } = req.body;
    const result = await tagada.subscriptions.create({
      customerId,
      priceId,
      storeId,
      currency,
      defaultPaymentInstrumentId,
      paymentId,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Subscription failed';
    res.status(400).json({ error: message });
  }
});

/** POST /api/customers — create or reuse a customer record */
app.post('/api/customers', async (req, res) => {
  try {
    const { storeId, email, firstName, lastName } = req.body;
    const customer = await tagada.customers.create({ storeId, email, firstName, lastName });
    res.json({ customer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Customer creation failed';
    res.status(400).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`SaaS billing API running on http://localhost:${PORT}`);
});
