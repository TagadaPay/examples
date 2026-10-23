# Basic post-purchase funnel

A landing page, a checkout, two one-click offers, a downsell and a thank you page that lists every order the shopper accepted.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.20.1, `@tagadapay/core-js` 3.7.0, `@tagadapay/node-sdk` 3.27.1 (seed script) |
| **Minimum versions** | headless-sdk 1.20.1, core-js 3.0.0, node-sdk 3.16.0 |
| **Stack** | Vite 7, React 19, React Router 6, Node 20+ for the seed script |
| **Status** | Stable |
| **Tutorial** | [Basic post-purchase](https://docs.tagada.io/developer-tools/funnel-demos/basic-post-purchase) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
/              landing: "Buy now" creates a checkout session (tee $29.99)
/checkout      pay
/offer         cap $19.99: Yes → tote, No → downsell
/downsell      cap $14.99: Yes → tote, No → thank you
/offer-tote    tote $24: Yes or No → thank you
/thank-you     main order + relatedOrders (one child order per accepted offer)
```

`scripts/seed.ts` creates the four products, the three offers and a free shipping rate, then writes their ids into `.env`.

You can also skip the code: [`funnel.bundle.json`](./funnel.bundle.json) imports the same funnel into the CRM (Funnels → **Import bundle**, beta). Preview it from the landing step; the store needs a default payment flow.

## Run it in 3 steps

```bash
cd v2/basic-post-purchase
npx -p @tagadapay/node-sdk tagada-init you@example.com   # 1. free sandbox account, writes TAGADA_API_KEY to .env
pnpm install && pnpm seed                                 # 2. install, then create products and offers
pnpm dev                                                  # 3. open http://localhost:5173
```

Already have an API key? Replace step 1 with `pnpm seed YOUR_API_KEY` (or copy [`.env.example`](./.env.example) to `.env` and fill it).

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC. Then accept or decline the offers.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/pages/Landing.tsx`](./src/pages/Landing.tsx) | `createSessionUrl`: from a product to a checkout session |
| [`src/pages/Checkout.tsx`](./src/pages/Checkout.tsx) | Card form and `processPayment` |
| [`src/pages/Offer.tsx`](./src/pages/Offer.tsx) | One-click offers with `processOfferPayment` |
| [`src/pages/ThankYou.tsx`](./src/pages/ThankYou.tsx) | `useOrder` and `relatedOrders` |
| [`scripts/seed.ts`](./scripts/seed.ts) | The Node SDK calls that build the catalog |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The page shows "Missing store id" | Run `pnpm seed`, or set `VITE_STORE_ID` in `.env`, then restart `pnpm dev`. |
| Checkout spins after import from `funnel.bundle.json` | The store has no default payment flow. Set one in the dashboard. |
| `pnpm seed` returns 401 | The API key is wrong or revoked. Create a new one in the dashboard (Settings → Access Tokens). |

## Learn more

- [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction): the routed variations of this funnel
- Headless SDK: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

MIT licensed. Fork it freely.
