/**
 * Automated end-to-end verification — run before publishing docs.
 * Usage: npm run verify
 *
 * Requires in .env:
 *   TAGADA_API_KEY   — CRM key (sk_crm_…)
 *   TAGADA_STORE_ID  — store routed to a sandbox-capable payment flow
 */
import 'dotenv/config';
import Tagada from '@tagadapay/node-sdk';
import { Tokenizer } from '@tagadapay/core-js/core';

const CRM_KEY = process.env.TAGADA_API_KEY;
const STORE_ID = process.env.TAGADA_STORE_ID;
const FLOW_ID = process.env.TAGADA_PAYMENT_FLOW_ID;

if (!CRM_KEY || !STORE_ID) {
  console.error('Set TAGADA_API_KEY and TAGADA_STORE_ID in .env');
  process.exit(1);
}

const tagada = new Tagada(CRM_KEY);

async function main() {
  console.log('Verifying SaaS billing flow...\n');

  // Ensure we have a recurring price
  let priceId = process.env.SAAS_PRICE_ID;
  if (!priceId) {
    const product = await tagada.products.create({
      storeId: STORE_ID!,
      name: 'SaaS Verify Plan',
      active: true,
      isShippable: false,
      variants: [{
        name: 'Monthly', sku: `verify-${Date.now()}`, grams: null, active: true, default: true, price: 100,
        compareAtPrice: null,
        prices: [{
          currencyOptions: { EUR: { amount: 100 } },
          recurring: true, billingTiming: 'subscription', interval: 'month', intervalCount: 1, default: true,
        }],
      }],
    });
    priceId = product.variants![0].prices![0].id!;
    console.log('Created test price:', priceId);
  }

  // Tokenize the universal sandbox test card (same code path as the browser)
  const tokenizer = new Tokenizer({ environment: 'production' });
  const tagadaToken = await tokenizer.tokenizeCard({
    cardNumber: '4242424242424242',
    expiryDate: '12/30',
    cvc: '123',
    cardholderName: 'Verify Test',
  });

  const email = `verify+${Date.now()}@example.com`;
  const customer = await tagada.customers.create({
    storeId: STORE_ID!, email, firstName: 'Verify', lastName: 'Test',
  });

  const { paymentInstrument } = await tagada.paymentInstruments.createFromToken({
    tagadaToken, storeId: STORE_ID!,
    customerData: { email, firstName: 'Verify', lastName: 'Test' },
  });

  const { payment } = await tagada.payments.process({
    amount: 100,
    currency: 'EUR',
    storeId: STORE_ID!,
    paymentInstrumentId: paymentInstrument.id,
    customerId: customer.id,
    initiatedBy: 'customer',
    ...(FLOW_ID ? { paymentFlowId: FLOW_ID } : {}),
  });
  console.log('Payment:', payment.id, payment.status, 'processor:', payment.processorId);
  if (payment.status !== 'succeeded') throw new Error(`Payment not succeeded: ${payment.status}`);

  const { subscription } = await tagada.subscriptions.create({
    customerId: customer.id,
    priceId, storeId: STORE_ID!, currency: 'EUR',
    defaultPaymentInstrumentId: paymentInstrument.id,
    paymentId: payment.id,
  });
  console.log('Subscription:', subscription.id, subscription.status);

  const rebill = await tagada.subscriptions.rebill(subscription.id);
  console.log('Rebill:', rebill.success ? 'OK' : rebill.message);

  // Test payments.continue exists (node-sdk >= 3.2.0)
  if (typeof tagada.payments.continue !== 'function') throw new Error('payments.continue missing');

  // Test webhooks.constructEvent
  const crypto = await import('node:crypto');
  const body = JSON.stringify({ type: 'payment/succeeded', data: { id: payment.id } });
  const sig = 'sha256=' + crypto.createHmac('sha256', 'test_secret').update(body, 'utf8').digest('hex');
  const event = tagada.webhooks.constructEvent(body, sig, 'test_secret');
  if ((event as { type: string }).type !== 'payment/succeeded') throw new Error('constructEvent failed');

  console.log('\n✅ All checks passed');
}

main().catch((e) => {
  console.error('\n❌', e.message);
  process.exit(1);
});
