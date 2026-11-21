/**
 * Charge a card, read the payment back, then refund part of it.
 *
 *   pnpm charge
 */
import { TagadaAPIError } from '@tagadapay/node-sdk';
import { inMode, money, paymentMethodId, storeId, tagada, write, requestIdOf, returnUrl } from './tagada.ts';

const orderId = `order_${Date.now()}`;

try {
  // 1. The buyer. Optional, but it ties the payment and its saved card to someone.
  const customer = await tagada.payments.v3.customers.create(
    { store: storeId, email: 'buyer@example.com', first_name: 'Ada', last_name: 'Lovelace' },
    write(),
  );
  console.log(`customer ${customer.id}`);

  // 2. Create and confirm in one call. Reuse your order id as the idempotency key: a retry never charges twice.
  const payment = await tagada.payments.v3.payments.create(
    {
      store: storeId,
      amount: 4900,
      currency: 'USD',
      customer: customer.id,
      payment_method: await paymentMethodId(),
      confirm: true,
      return_url: returnUrl,
      merchant_reference: orderId,
      description: 'Example order',
    },
    write(`create_${orderId}`),
  );
  console.log(`payment ${payment.id}: ${payment.status}, ${money(payment.amount, payment.currency)}`);

  if (payment.status === 'requires_action') {
    // 3DS or a redirect: the shopper's browser finishes it with the client secret
    // (@tagadapay/core-js/payments-v3 confirmPayment / handleNextAction).
    console.log(`the browser must finish it: client_secret ${payment.client_secret?.slice(0, 12)}…`);
    process.exit(0);
  }
  if (payment.status !== 'succeeded') {
    console.log(`not paid: ${payment.last_outcome?.reason ?? payment.status}`);
    process.exit(1);
  }

  // 3. Read it back: the server is the source of truth, never the browser.
  const read = await tagada.payments.v3.payments.retrieve(payment.id, inMode);
  console.log(`read back: ${read.status}, captured ${money(read.amount_captured, read.currency)}`);

  // 4. Refund 10.00.
  const refund = await tagada.payments.v3.refunds.create(
    { payment: payment.id, amount: 1000, reason: 'requested' },
    write(`refund_${orderId}`),
  );
  console.log(`refund ${refund.id}: ${refund.status}, ${money(refund.amount, refund.currency)}`);

  const timeline = await tagada.payments.v3.payments.timeline(payment.id, inMode);
  console.log(`timeline: ${JSON.stringify(timeline).length} bytes of events`);
} catch (error) {
  if (error instanceof TagadaAPIError) {
    // The API error: type, code, message, and the request id to give support.
    console.error(`${error.statusCode} ${error.code}: ${error.message} (request ${requestIdOf(error)})`);
    process.exit(1);
  }
  throw error;
}
