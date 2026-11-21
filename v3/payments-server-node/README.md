# Payments API from a Node server

Three scripts that drive the Payments API (V3) from a server with `@tagadapay/node-sdk` and **the API key you already have**: charge and refund, authorize then capture or cancel, and change how a store routes its payments (payment policy).

| | |
| --- | --- |
| **API version** | Payments API (V3), `Payments-Version: 2026-11-01` ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDK** | `@tagadapay/node-sdk` 3.40.0 or later, `tagada.payments.v3` (experimental) |
| **Key** | Your Tagada API key (Dashboard → Settings → Access Tokens), the same as for V2 |
| **Stack** | Node 20+, tsx, no framework |
| **Status** | Experimental (the API itself is in Preview) |

## Before you start

- **Your store must be on the Payments API.** A store still on V2 refuses V3 payments with `409 store_not_on_payments_api` ("This store takes its payments on V2."). TagadaPay moves stores one by one: ask [api-support@tagadapay.com](mailto:api-support@tagadapay.com). Your V2 integration keeps working before and after the move.
- **Test mode** (`TAGADA_MODE=test`) needs a test-mode processor on the store's policy. Live mode charges real cards.
- **The card comes from the browser.** Your server never sees a card number: `@tagadapay/core-js/payments-v3` tokenizes it and gives your server a vault token (or a payment method id). Put one of them in `.env`.

## Run it

```bash
cd v3/payments-server-node
cp .env.example .env        # TAGADA_API_KEY, TAGADA_STORE_ID, and the card (TAGADA_PAYMENT_METHOD or TAGADA_VAULT_TOKEN)
pnpm install

pnpm charge                 # customer, payment (create + confirm), read back, refund 10.00, timeline
pnpm manual-capture         # authorize 49.00, capture 30.00
pnpm manual-capture --cancel  # authorize 49.00, cancel (releases the hold)
pnpm policy                 # show the store's policy and processors (reads only)
pnpm policy --publish       # split new payments evenly between active processors, backups on (changes routing)
```

What `pnpm charge` prints on a test store:

```
customer cus_c00d14a1c5d9
payment method inst_27e1da8bd41e: visa •••• 4242
payment pay_640247c2ebaa: succeeded, 49.00 USD
read back: succeeded, captured 49.00 USD
refund rfd_01m7zdyvdbdrp761qkt85b4epk: succeeded, 10.00 USD
timeline: 7396 bytes of events
```

## What to copy into your app

```ts
import { Tagada } from '@tagadapay/node-sdk';

const tagada = new Tagada(process.env.TAGADA_API_KEY!);

const payment = await tagada.payments.v3.payments.create(
  {
    store: 'store_…',
    amount: 4900,                       // minor units: 49.00
    currency: 'USD',
    payment_method: 'inst_…',           // from the browser, or a card saved earlier
    confirm: true,                      // create and charge in one call
    return_url: 'https://shop.example/checkout/return', // required to confirm a customer payment
  },
  { idempotencyKey: `create_${orderId}` }, // same key = same payment, never a second charge
);

if (payment.status === 'requires_action') {
  // 3DS or redirect: hand payment.client_secret to the page, core-js/payments-v3 finishes it.
}
```

## Good to know (checked against the API)

| | |
| --- | --- |
| **Idempotency** | Every write carries an `Idempotency-Key`. Pass yours (your order id); otherwise the SDK makes one per call and reuses it on its own retries. The same key returns the same payment; the same key with a different body answers `409 idempotency_key_reused`. |
| **`return_url`** | Confirming a customer payment without it answers `400 parameter_missing` ("Confirmation requires return_url."). |
| **Statuses** | `succeeded`, `requires_capture` (manual capture), `requires_action` (the browser must finish), `failed`, `canceled`. Read the payment back on your server before you fulfil. |
| **Errors** | SDK errors carry `statusCode`, `code` and `message`. The Payments API request id to give support is in `error.raw.error.request_id`. |
| **Mode** | `{ mode: 'test' }` on a call sends it in test mode; live otherwise. |
| **Renewals** | Read only from this SDK: Tagada schedules renewals. |

## Files

| File | What it shows |
| --- | --- |
| [`src/tagada.ts`](src/tagada.ts) | The client, the mode, idempotency keys, the card from the browser |
| [`src/charge.ts`](src/charge.ts) | Customer, payment, read back, partial refund, timeline, error handling |
| [`src/manual-capture.ts`](src/manual-capture.ts) | `capture_method: 'manual'`, partial capture, cancel |
| [`src/policy.ts`](src/policy.ts) | Read a store's policy, edit its routing as a draft, publish |

Docs: [Payments API overview](https://docs.tagada.io/payments-api/overview) · [Payment lifecycle](https://docs.tagada.io/payments-api/payment-lifecycle) · [API reference](https://docs.tagada.io/payments-api/reference/introduction)
