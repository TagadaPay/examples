# SaaS subscription billing

A minimal SaaS app that bills a monthly plan: the browser tokenizes the card with `@tagadapay/core-js`, an Express server vaults it, charges it and creates the subscription with `@tagadapay/node-sdk`, routed through a payment flow.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/core-js` 3.7.0 (browser), `@tagadapay/node-sdk` 3.27.1 (server) |
| **Minimum versions** | core-js 3.1.0, node-sdk 3.25.0 (the `customer` block that forwards the shopper IP and user agent) |
| **Stack** | Vite 7 + React 19 (`web/`), Express 4 + tsx (`server/`), Node 20+ |
| **Status** | Stable |
| **Tutorial** | [SaaS Billing quick start](https://docs.tagada.io/developer-tools/saas-billing/quick-start) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

| Layer | Package | Responsibility |
| --- | --- | --- |
| Frontend (`web/`) | `@tagadapay/core-js` | Card tokenization (`useCardTokenization`). Never sees your API key. |
| Backend (`server/`) | `@tagadapay/node-sdk` | Customer, vault, charge, subscription, all server side. |
| Routing | Payment flows | Cascade from the sandbox to your live TPA without re-vaulting the card. |

Click **Subscribe** and the page walks the whole chain: create the customer, vault the token (`paymentInstruments.createFromToken`), charge the first month (`payments.process`), then create the subscription (`subscriptions.create`) that rebills monthly.

## Run it in 3 steps

```bash
cd v2/mini-saas-billing
cp .env.example .env            # 1. fill TAGADA_API_KEY and TAGADA_STORE_ID
pnpm install && pnpm seed       # 2. install, then create the plan and the cascade payment flow
pnpm dev                        # 3. open http://localhost:5173 (API on :3001)
```

No account yet? `npx -p @tagadapay/node-sdk tagada-init you@example.com` creates a free sandbox account and writes your `.env`. `pnpm verify` runs the whole flow from the terminal (tokenize, vault, charge, subscribe) to check your setup.

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC. It goes through the sandbox processor of the cascade; a live TPA needs a real card.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`server/index.ts`](./server/index.ts) | Every Node SDK call behind `/api/*`, and `shopperContext` (shopper IP and user agent sent with the charge) |
| [`web/src/App.tsx`](./web/src/App.tsx) | Tokenization with `useCardTokenization` and the Subscribe sequence |
| [`scripts/seed.ts`](./scripts/seed.ts) | The cascade payment flow and the recurring price (Pro, 19 EUR a month) |
| [`scripts/verify-flow.ts`](./scripts/verify-flow.ts) | The same flow, end to end, without a browser |

## How it works

`pnpm seed` creates a **cascade** payment flow on your account:

```
Primary:  sandbox processor    (dev and test cards)
Fallback: tagadapay-router     → your live TPA (tpa_xxx)
```

The server passes `paymentFlowId` on each charge. You can add more processors or TPAs to the same flow: the card stays in one vault, so switching or adding a processor never asks the customer to enter the card again.

The server also exposes `/api/threeds/sessions`, `/api/payments/continue` and `/api/payments/:id` for 3DS and redirect flows. The demo page itself expects the first charge to succeed directly, which is the case with the sandbox test card.

Every code path (tokenize, vault, charge, subscribe, rebill) was run against the production API before being documented. Run `pnpm verify` to re-validate it on your own account.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Missing TAGADA_API_KEY in .env` | Copy `.env.example` to `.env` and fill it, or run `tagada-init`. |
| `pnpm seed` fails with `No tagadapay-router processor found on this account` | The cascade needs a live TagadaPay account (TPA) on the account. Apply for one first, see [Apply for TagadaPay Processing](https://docs.tagada.io/developer-tools/node-sdk/processing-applications). |
| `No sandbox processor found` | Create a sandbox processor in the dashboard, then run `pnpm seed` again. |
| The page shows `Payment requires_action` or another non succeeded status | The card asked for 3DS. Use the sandbox card above, or wire the 3DS endpoints of `server/index.ts` into the page. |

## Learn more

- [SaaS Billing introduction](https://docs.tagada.io/developer-tools/saas-billing/introduction)
- [Payment flows for SaaS](https://docs.tagada.io/developer-tools/saas-billing/payment-flows)
- [Migrate from Stripe](https://docs.tagada.io/developer-tools/saas-billing/migrate-from-stripe)

MIT licensed. Fork it freely.
