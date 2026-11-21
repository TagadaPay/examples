import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { Tagada, type PaymentsV3RequestOptions } from '@tagadapay/node-sdk';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name} in .env (see .env.example).`);
    process.exit(1);
  }
  return value;
}

const origin = (process.env.TAGADA_API_URL ?? 'https://api.tagada.io').replace(/\/+$/, '');

/** One client, your usual Tagada API key: `tagada.payments.v3` reaches the Payments API with it. */
export const tagada = new Tagada({ apiKey: required('TAGADA_API_KEY'), baseUrl: `${origin}/api/public/v1` });

export const storeId = required('TAGADA_STORE_ID');
export const mode: 'live' | 'test' = process.env.TAGADA_MODE === 'live' ? 'live' : 'test';

/** Every call of this example runs in the same mode. */
export const inMode: PaymentsV3RequestOptions = { mode };

/** Options of one write: an idempotency key you keep (e.g. your order id) makes a retry safe. */
export function write(idempotencyKey: string = randomUUID()): PaymentsV3RequestOptions {
  return { mode, idempotencyKey };
}

/**
 * The card to charge: a payment method saved earlier, or one made now from the vault token the browser
 * produced (`@tagadapay/core-js/payments-v3` tokenizes the card; your server never sees the number).
 */
export async function paymentMethodId(): Promise<string> {
  const saved = process.env.TAGADA_PAYMENT_METHOD?.trim();
  if (saved) return saved;
  const vaultToken = required('TAGADA_VAULT_TOKEN');
  const method = await tagada.payments.v3.paymentMethods.create({ type: 'card', vault_token: vaultToken }, write());
  console.log(`payment method ${method.id}: ${method.card?.brand} •••• ${method.card?.last4}`);
  return method.id;
}

/** Where the shopper comes back after a 3DS or redirect step. Required to confirm a customer payment. */
export const returnUrl = process.env.TAGADA_RETURN_URL?.trim() || 'https://example.com/checkout/return';

/** The Payments API request id to give support, from an SDK error. */
export function requestIdOf(error: { raw?: unknown; requestId?: string | null }): string {
  const body = error.raw as { error?: { request_id?: string } } | undefined;
  return body?.error?.request_id ?? error.requestId ?? 'n/a';
}

export function money(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}
