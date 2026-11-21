/**
 * Authorize now, capture later (when you ship), or cancel to release the hold.
 *
 *   pnpm manual-capture            authorize then capture 30.00 of 49.00
 *   pnpm manual-capture --cancel   authorize then cancel
 */
import { TagadaAPIError } from '@tagadapay/node-sdk';
import { money, paymentMethodId, storeId, tagada, write, requestIdOf, returnUrl } from './tagada.ts';

const cancel = process.argv.includes('--cancel');
const orderId = `order_${Date.now()}`;

try {
  const payment = await tagada.payments.v3.payments.create(
    {
      store: storeId,
      amount: 4900,
      currency: 'USD',
      payment_method: await paymentMethodId(),
      confirm: true,
      return_url: returnUrl,
      capture_method: 'manual',
      merchant_reference: orderId,
    },
    write(`create_${orderId}`),
  );
  console.log(`payment ${payment.id}: ${payment.status}, capturable ${money(payment.amount_capturable, payment.currency)}`);
  if (payment.status !== 'requires_capture') {
    console.log(`not authorized: ${payment.last_outcome?.reason ?? payment.status}`);
    process.exit(1);
  }

  if (cancel) {
    const canceled = await tagada.payments.v3.payments.cancel(payment.id, {}, write(`cancel_${orderId}`));
    console.log(`canceled: ${canceled.status}`);
  } else {
    // Capture less than authorized if part of the order did not ship.
    const captured = await tagada.payments.v3.payments.capture(payment.id, { amount: 3000 }, write(`capture_${orderId}`));
    console.log(`captured: ${captured.status}, ${money(captured.amount_captured, captured.currency)}`);
  }
} catch (error) {
  if (error instanceof TagadaAPIError) {
    console.error(`${error.statusCode} ${error.code}: ${error.message} (request ${requestIdOf(error)})`);
    process.exit(1);
  }
  throw error;
}
