# TagadaPay SaaS Billing Demo

A minimal SaaS app showing how to bill subscriptions with **@tagadapay/core-js** (frontend) and **@tagadapay/node-sdk** (backend) — processor-agnostic, powered by **payment flows**.

## What this demonstrates

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **Frontend** | `@tagadapay/core-js` | Card tokenization (PCI-safe). Never touches your API key. |
| **Backend** | `@tagadapay/node-sdk` | Customer, vault, charge, subscription — all server-side. |
| **Routing** | Payment flows | Cascade across sandbox → your live TPA without re-vaulting. |

Unlike Stripe, you connect **multiple processors/TPAs** to one vault. If one TPA is banned, switch the payment flow — cards stay vaulted.

## Quick start

```bash
cd mini-saas-billing
cp env.example .env
# Fill TAGADA_API_KEY and TAGADA_STORE_ID

npm install
npm run seed      # creates product + cascade payment flow
npm run verify    # automated end-to-end test
npm run dev       # frontend :5173 + backend :3001
```

Open http://localhost:5173 and click **Subscribe**.

> **Need an account?** `npx -p @tagadapay/node-sdk tagada-init you@example.com` provisions a free sandbox account and writes your `.env`.

## Test card

```
4242 4242 4242 4242   ·   12/30   ·   123
```

Works with the sandbox processor in the cascade flow. A live TPA requires a real card.

## Project structure

```
mini-saas-billing/
├── server/index.ts       ← BACKEND (node-sdk) — API routes
├── web/src/App.tsx       ← FRONTEND (core-js) — checkout UI
├── scripts/
│   ├── seed.ts           ← one-time setup (product + payment flow)
│   └── verify-flow.ts    ← automated end-to-end test
└── env.example
```

## Payment flow (the Stripe killer)

The seed script creates a **cascade** flow:

```
Primary:  sandbox processor    (dev / test cards)
Fallback: tagadapay-router     → your live TPA (tpa_xxx)
```

Add Stripe, Checkout.com, or more TPAs to the same flow — one vault, automatic failover, higher approval rates. If a processor gets banned, update the flow: customers never re-enter their card.

## Docs

- [SaaS Billing introduction](https://docs.tagada.io/developer-tools/saas-billing/introduction)
- [Quick start](https://docs.tagada.io/developer-tools/saas-billing/quick-start)
- [Payment flows for SaaS](https://docs.tagada.io/developer-tools/saas-billing/payment-flows)
- [Migrate from Stripe](https://docs.tagada.io/developer-tools/saas-billing/migrate-from-stripe)

## Verified against production

Every code path in this example (tokenize → vault → charge → subscribe → rebill) was run against the production API before being documented. Run `npm run verify` to re-validate on your own account.
