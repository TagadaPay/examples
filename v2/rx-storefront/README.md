# Tagada Rx storefront

A headless Tagada Rx storefront that creates the same Funnel v2 the hosted templates get on publish: landing, marketing quiz, checkout, offer, thank you with the medical intake, patient portal.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.20.1, `@tagadapay/core-js` 3.7.0, `@tagadapay/node-sdk` 3.27.1 (seed script) |
| **Minimum versions** | headless-sdk 1.13.0 (`useRx`), core-js 3.2.0, node-sdk 3.16.0 (`funnels.create`) |
| **Stack** | Vite 7, React 19, React Router 6, Node 20+ for the seed script |
| **Status** | Stable. The intake step needs Tagada Rx active on the store. |
| **Tutorial** | [Tagada Rx with the Headless SDK](https://docs.tagada.io/developer-tools/rx/headless-sdk) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
/              landing
/quiz          marketing quiz (no medical questions), starts checkout
/checkout      pay
/offer         optional post-purchase box (skipped in this demo)
/thank-you     medical intake AFTER payment: submitCase, then poll
/portal        patient portal (OTP sign-in, cases: see the portal docs)
```

`scripts/seed.ts` creates a sandbox processor, a payment flow, the store, one product and a free shipping rate, then calls `tagada.funnels.create` with the six-step graph above (`isDefault: true`) and writes the ids into `.env`. Open the new store in the CRM → **Funnels** and you see the six boxes.

You can also import the graph without the seed: [`funnel.bundle.json`](./funnel.bundle.json) → Funnels → **Import bundle** (beta).

## Run it in 3 steps

```bash
cd v2/rx-storefront
npx -p @tagadapay/node-sdk tagada-init you@example.com   # 1. free sandbox account, writes TAGADA_API_KEY to .env
pnpm install && pnpm seed                                 # 2. install, then create the store and the Funnel v2
pnpm dev                                                  # 3. open http://localhost:5173
```

Already have an API key? Replace step 1 with `pnpm seed YOUR_API_KEY` (or copy [`.env.example`](./.env.example) to `.env` and fill it).

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/pages/Quiz.tsx`](./src/pages/Quiz.tsx) | Marketing quiz that starts checkout with `createSessionUrl` |
| [`src/pages/Checkout.tsx`](./src/pages/Checkout.tsx) | Self-hosted checkout with `usePayment` and `processPayment` |
| [`src/pages/ThankYou.tsx`](./src/pages/ThankYou.tsx) | `useRx`: `isRequiredForProduct`, `getQuestionsForProduct`, `pollOrder`, `submitCase`, `cases` |
| [`src/pages/Portal.tsx`](./src/pages/Portal.tsx) | Where the patient portal plugs in |
| [`scripts/seed.ts`](./scripts/seed.ts) | Store, product and the Funnel v2 graph via `tagada.funnels.create` |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The page shows "Missing store id" | Run `pnpm seed`, or set `VITE_STORE_ID` in `.env`, then restart `pnpm dev`. |
| `submitCase failed` on the thank you page | Tagada Rx is not active on the store, or the product is not mapped to a clinical offering. Checkout and the funnel still work without it. |
| "This product is not mapped to an Rx offering" | Expected on a fresh sandbox store: map the product to an offering in the CRM to get the intake questions. |

## Learn more

- [Tagada Rx with the Headless SDK](https://docs.tagada.io/developer-tools/rx/headless-sdk): building blocks and `funnels.create`
- [Building blocks](https://docs.tagada.io/developer-tools/rx/building-blocks)
- [Patient portal](https://docs.tagada.io/developer-tools/rx/patient-portal)

MIT licensed. Fork it freely.
