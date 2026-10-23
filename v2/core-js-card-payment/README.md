# Minimal card payment

The smallest "you already have the order" card payment: one page, one card form, one charge, and a `/return` route that resumes the payment after a 3DS or processor redirect.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/core-js` 3.7.0 |
| **Minimum versions** | core-js 3.0.0 |
| **Stack** | Vite 5, React 18, Tailwind 3, zustand |
| **Status** | Stable |
| **Tutorial** | [Card tokenization & 3DS: the minimal variant](https://docs.tagada.io/developer-tools/examples/card-tokenization#the-minimal-variant) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

1. **Tokenize** the card in the browser with `useCardTokenization` from `@tagadapay/core-js/react`. Raw card data goes to the vault (Basis Theory), never to your server.
2. **Create a payment instrument** from the token: `POST /api/public/v1/payment-instruments/create-from-token`.
3. **Charge** it: `POST /api/public/v1/payments/process`. When the response asks for an action, the page runs Radar (`useAirwallexRadar`, then `POST /api/public/v1/payments/continue`) or redirects to the 3DS challenge.
4. **Resume** on `/return?paymentId=…` and poll `GET /api/public/v1/payments/:id` until the payment is final.

This is the skeleton of [`../core-js-tokenization`](../core-js-tokenization), which runs the same flow with a narrated UI. Read that one to learn, copy this one to ship.

## Run it in 3 steps

```bash
cd v2/core-js-card-payment
pnpm install      # 1. install
pnpm dev          # 2. start on http://localhost:5174
                  # 3. fill the config panel, then pay
```

This example reads no environment variables, so there is no `.env` to fill. You type the settings in the in-app config panel: the environment, an API token (dashboard → API Keys) and a store (picked from your stores once the token is set). The panel keeps them in the browser's local storage.

Pay with a sandbox card from the built-in list, for example `4242 4242 4242 4242`, any future date, any CVC. The list also has 3DS challenge, frictionless and decline cards. See [sandbox testing](https://docs.tagada.io/developer-tools/node-sdk/sandbox-testing).

> **Security: demo only.** To keep the whole flow on one page, the browser calls the API with your secret API token. Never do this in production: steps 2 to 4 belong on your server, and the token must never reach the browser. [`../core-js-tokenization/src/api/paymentBackend.ts`](../core-js-tokenization/src/api/paymentBackend.ts) shows the same calls written as server functions.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/hooks/useCardPayment.ts`](./src/hooks/useCardPayment.ts) | The whole flow: tokenize, create the instrument, process, handle `requireAction` |
| [`src/hooks/usePaymentPolling.ts`](./src/hooks/usePaymentPolling.ts) | Polling the payment until it is final |
| [`src/pages/CardPaymentPage.tsx`](./src/pages/CardPaymentPage.tsx) | The page: config, amount, card form, result |
| [`src/pages/TestReturnPage.tsx`](./src/pages/TestReturnPage.tsx) | Resuming on `/return` after a redirect |
| [`src/lib/api.ts`](./src/lib/api.ts) | The HTTP helper and the response types of `payments/process` |
| [`src/lib/config-store.ts`](./src/lib/config-store.ts) | Environments and the persisted config |
| [`src/lib/test-cards.ts`](./src/lib/test-cards.ts) | Sandbox cards by processor and outcome |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The store list stays empty | The API token is missing or wrong, or it was created for another environment. Check the environment selected in the panel. |
| 401 on `create-from-token` or `payments/process` | The token is revoked or lacks access to the store. Create a new one in the dashboard. |
| "Missing 3DS challenge URL in payment response" | The processor asked for a redirect without a URL. Check the raw response in the log panel and the store's payment flow. |
| The page after 3DS shows the form again | You came back without `paymentId` in the URL. The return URL must be `/return?paymentId=…`, built by the hook. |

## Learn more

- [`../core-js-tokenization`](../core-js-tokenization): the narrated version of this flow
- [`../apple-google-tokenization`](../apple-google-tokenization): Apple Pay and Google Pay tokens on the same API
- [core-js payments](https://docs.tagada.io/developer-tools/payments/core-js-payments)
- [Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration)

MIT licensed. Fork it freely.
