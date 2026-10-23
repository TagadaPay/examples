# Card tokenization and 3DS

A narrated walkthrough of a card payment when you already have the order: tokenize a card, create a payment instrument, run 3DS, charge, and watch every call in the log.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/core-js` 3.7.0 |
| **Minimum versions** | core-js 3.0.0 |
| **Stack** | Vite 7, React 19, Tailwind 3 |
| **Status** | Stable |
| **Tutorial** | [Card tokenization & 3DS](https://docs.tagada.io/developer-tools/examples/card-tokenization) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
1. Browser   tokenize the card (useCardTokenization)      → { tagadaToken, rawToken }
2. Browser   read rawToken.metadata.auth.scaRequired      → is 3DS required by the card?
3. Server    create a payment instrument                  POST /api/public/v1/payment-instruments/create-from-token
4. Browser   create a 3DS session (useThreeds), optional
5. Server    persist the 3DS session                      POST /api/public/v1/threeds/create-session
6. Server    charge                                       POST /api/public/v1/payments/process
7. Browser   show the 3DS challenge if the bank asks for it
8. Server    poll until the payment is final              GET  /api/public/v1/payments/:id
```

The page also keeps a history of recent tokens and store ids, and can retry 3DS from the beginning with a fresh session.

[`../core-js-card-payment`](../core-js-card-payment) is the same flow without the narration. Read this one to learn, copy that one to ship.

## Run it in 3 steps

```bash
cd v2/core-js-tokenization
pnpm install      # 1. install
pnpm dev          # 2. start on http://localhost:5173
                  # 3. fill the server config on the page, then tokenize and pay
```

This example reads no environment variables, so there is no `.env` to fill. You type the API base URL (default `https://app.tagadapay.com`), an API token (dashboard → API Keys) and a store id in the server config section of the page.

Pay with `4242 4242 4242 4242` (3DS optional), any future date, any CVC. Use a European test card that requires SCA to see the 3DS challenge. See [sandbox testing](https://docs.tagada.io/developer-tools/node-sdk/sandbox-testing).

> **Security: demo only.** To show the whole flow on one page, the browser calls the API with your secret API token through `DemoBackendClient`. Never do this in production: move the functions of [`src/api/paymentBackend.ts`](./src/api/paymentBackend.ts) to your server and keep the token there.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/components/CardForm.tsx`](./src/components/CardForm.tsx) | Card form and `useCardTokenization` |
| [`src/hooks/usePaymentFlow.ts`](./src/hooks/usePaymentFlow.ts) | Orchestration: instrument, 3DS session (`useThreeds`), charge, challenge |
| [`src/api/paymentBackend.ts`](./src/api/paymentBackend.ts) | The server side: `createPaymentInstrument`, `persistThreedsSession`, `processPayment`, `pollPaymentStatus`, and the demo-only `DemoBackendClient` |
| [`src/api/README.md`](./src/api/README.md) | How to move those functions behind your server |
| [`src/App.tsx`](./src/App.tsx) | The demo UI, SCA detection and the 3DS retry |
| [`src/utils/localStorage.ts`](./src/utils/localStorage.ts) | Token and store history |

## How it works

### SCA detection

`tokenizeCard` returns the `tagadaToken` (send it to your server) and the `rawToken` (for the UI). Read the provider-agnostic flag, not the vault's raw fields:

```ts
const { tagadaToken, rawToken } = await tokenizeCard(cardData);
if (rawToken.metadata?.auth?.scaRequired) {
  // the card requires 3DS: create a 3DS session before charging
}
```

The raw provider response stays available in `rawToken.metadata.rawProviderResponse` for advanced use.

### Moving to production

The functions in `src/api/paymentBackend.ts` are plain TypeScript that take the API key as an argument. Put them behind your own routes (an Express route, a server action), authenticate the caller, check that the caller owns the store, and read the key from the server environment. In the browser, replace `DemoBackendClient` with a client that calls your routes.

Checklist before going live:

- The API token lives only on your server.
- Your routes authenticate the shopper session and check store ownership.
- Rate limiting, logging and the error paths (decline, 3DS failure, timeout) are tested.

### API endpoints used

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/public/v1/payment-instruments/create-from-token` | POST | Create a payment instrument from a TagadaToken |
| `/api/public/v1/threeds/create-session` | POST | Persist a 3DS session |
| `/api/public/v1/payments/process` | POST | Charge, with an optional `threedsSessionId` |
| `/api/public/v1/payments/:id` | GET | Poll the payment status |

### Local storage keys

`tagadapay_token_history`, `tagadapay_store_history`, `tagadapay_current_store` (up to 10 items per list). Clear them from the History panel.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 401 on `create-from-token` | The API token is wrong, revoked, or from another environment than the API base URL. |
| The 3DS challenge fails | Click **Retry 3DS from Beginning**: it resets the 3DS state, creates and persists a new session, and charges again. |
| No 3DS challenge with an SCA card | The store's processor runs its own 3DS, or the issuer authenticated frictionless. Check the payment in the log. |
| Old store ids in the form | Clear the history in the History panel. |

## Learn more

- [`../core-js-card-payment`](../core-js-card-payment): the minimal version
- [`../apple-google-tokenization`](../apple-google-tokenization): Apple Pay and Google Pay tokens
- [core-js payments](https://docs.tagada.io/developer-tools/payments/core-js-payments)
- [Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration)

MIT licensed. Fork it freely.
