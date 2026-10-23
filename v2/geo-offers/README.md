# Geo-based offers

The same tee for everyone, but the one-click post-purchase offer changes with the visitor's region: 🇺🇸 Varsity Cap $19.99, 🇪🇺 Alpine Beanie $17.99, 🌍 Travel Tote $24.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.21.0, `@tagadapay/core-js` 3.7.0, `@tagadapay/node-sdk` 3.27.1 (seed script) |
| **Minimum versions** | headless-sdk 1.13.0, core-js 3.2.0, node-sdk 3.16.0; with headless-sdk 1.21 or later, core-js 3.7.0 or later (its peer requirement) |
| **Stack** | Vite 7, React 19, React Router 6, Node 20+ for the seed script |
| **Status** | Stable |
| **Tutorial** | [Geo-based offers](https://docs.tagada.io/developer-tools/funnel-demos/geo-offers) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
/              landing: region chips (🇺🇸 / 🇪🇺 / 🌍) + "Buy now" (tee $29.99)
/checkout      pay
/offer         one route, three offers, picked by the region
/thank-you     main order + relatedOrders if you accepted
```

The region defaults to a guess from the browser timezone and the landing chips let you override it, so you can walk all three branches from one browser. On a hosted funnel the same split is three edges out of the checkout step:

- `customer.fromCountry { country: "US" }` → cap
- `customer.fromEU` → beanie
- `always` (lower priority) → tote

`scripts/seed.ts` creates the four products, the three offers and a free shipping rate, then writes their ids into `.env`.

You can also skip the code: [`funnel.bundle.json`](./funnel.bundle.json) imports the same graph into the CRM (a store → Funnels → **Import bundle**, beta). Preview it from the landing step (checkout alone has no cart); the store needs a default payment flow. Pixels and payment methods stay on the target account.

## Run it in 3 steps

```bash
cd v2/geo-offers
npx -p @tagadapay/node-sdk tagada-init you@example.com   # 1. free sandbox account, writes TAGADA_API_KEY to .env
pnpm install && pnpm seed                                 # 2. install, then create products and offers
pnpm dev                                                  # 3. open http://localhost:5173
```

Already have an API key? Replace step 1 with `pnpm seed YOUR_API_KEY` (or copy [`.env.example`](./.env.example) to `.env` and fill it).

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC. Pick a region on the landing, buy the tee and watch the offer change.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/lib/region.ts`](./src/lib/region.ts) | The demo stand-in for geo detection (timezone default, chip override) |
| [`src/pages/GeoOffer.tsx`](./src/pages/GeoOffer.tsx) | One `/offer` route that picks the offer by region |
| [`src/pages/Offer.tsx`](./src/pages/Offer.tsx) | One-click accept with `useOffers` and `processOfferPayment` |
| [`src/pages/Landing.tsx`](./src/pages/Landing.tsx) | Region chips and `createSessionUrl` |
| [`src/pages/ThankYou.tsx`](./src/pages/ThankYou.tsx) | `useOrder` and `relatedOrders` |
| [`scripts/seed.ts`](./scripts/seed.ts) | The Node SDK calls that build the catalog |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The page shows "Missing store id" | Run `pnpm seed`, or set `VITE_STORE_ID` in `.env`, then restart `pnpm dev`. |
| Always the same offer | The region is kept in `sessionStorage`. Click another chip on the landing, or open a new tab. |
| Checkout spins after import from `funnel.bundle.json` | The store has no default payment flow. Set one in the dashboard. |
| `pnpm seed` prints the usage line | No API key found. Pass it as an argument or run `tagada-init` first. |

## Learn more

- [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction): the catalog of funnel types
- Headless SDK: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

MIT licensed. Fork it freely.
