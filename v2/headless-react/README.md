# Headless React playground

A store simulator that walks every React hook of the Headless SDK, one step at a time, with the code of each step shown next to the UI.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.21.0, `@tagadapay/core-js` 3.7.0, `@tagadapay/node-sdk` 3.27.1 (seed and deploy scripts) |
| **Minimum versions** | headless-sdk 1.6.0, core-js 3.0.0 (with headless-sdk 1.21 or later, core-js 3.7.0 or later, its peer requirement); the scripts are tested on node-sdk 3.27.1 |
| **Stack** | Vite 7, React 19, Tailwind 3, TypeScript, Node 20+ for the scripts |
| **Status** | Stable |
| **Tutorial** | [Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

```
Products      →  Cart                 →  Checkout       →  Payment       →  Confirmation
useCatalog       useHeadlessClient       useCheckout        usePayment        useOffers
                 checkout.createSession  useGoogleAutocomplete
```

| Step | Hook | What it does |
| --- | --- | --- |
| Products | `useCatalog()` | Loads the real products of your store |
| Cart | `useHeadlessClient()` | `client.checkout.createSession()` from the local cart |
| Checkout | `useCheckout()`, `useGoogleAutocomplete()` | Customer, address, promo code, shipping rate |
| Payment | `usePayment()` | `tokenizeCard`, then `processPayment` (3DS and redirects included) |
| Confirmation | `useOffers()` | `listOffers`, `previewOffer`, `processOfferPayment` for one-click upsells |

Want a store that looks real instead of a step-by-step playground? Use [`../headless-react-store`](../headless-react-store).

## Run it in 3 steps

```bash
cd v2/headless-react
pnpm install && pnpm seed YOUR_API_KEY   # 1 and 2. install, then create a demo store and write .env
pnpm dev                                 # 3. open http://localhost:5173
```

`pnpm seed` creates a sandbox processor, a payment flow, a store, three products (headphones $99, charger $29, a $9.99 monthly plan), two upsell offers and a checkout funnel, then writes `VITE_STORE_ID` to `.env` (see [`.env.example`](./.env.example)). Get a key in the dashboard under Settings → Access Tokens, or create a free sandbox account with `npx -p @tagadapay/node-sdk tagada-init you@example.com`.

You can also skip the seed and type any store id into the config panel of the app.

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/App.tsx`](./src/App.tsx) | `TagadaHeadlessProvider`, cart state and the step flow |
| [`src/components/ProductGrid.tsx`](./src/components/ProductGrid.tsx) | `useCatalog` |
| [`src/components/CartDrawer.tsx`](./src/components/CartDrawer.tsx) | `useHeadlessClient` and `client.checkout.createSession` |
| [`src/components/CheckoutStep.tsx`](./src/components/CheckoutStep.tsx) | `useCheckout` and `useGoogleAutocomplete` |
| [`src/components/PaymentStep.tsx`](./src/components/PaymentStep.tsx) | `usePayment`: `tokenizeCard`, `processPayment` |
| [`src/components/ConfirmationStep.tsx`](./src/components/ConfirmationStep.tsx) | `useOffers`: `listOffers`, `previewOffer`, `processOfferPayment` |
| [`scripts/seed.ts`](./scripts/seed.ts) | The Node SDK calls that build the demo store |
| [`scripts/deploy.ts`](./scripts/deploy.ts) | Deploy the build to the TagadaPay CDN |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No products show up | The store id is empty or wrong. Run `pnpm seed YOUR_API_KEY`, or paste a store id in the config panel. |
| `pnpm seed` prints the usage line | Pass the API key as the first argument. |
| Address autocomplete does nothing | It needs a Google Places key in `VITE_GOOGLE_AUTOCOMPLETE_API_KEY`. The rest of the checkout works without it. |
| `pnpm deploy` says "Missing TAGADA_API_KEY" | Pass it inline: `TAGADA_API_KEY=... pnpm deploy`. |

## Going further

Deploy to the TagadaPay edge CDN:

```bash
pnpm build
TAGADA_API_KEY=your_api_key pnpm deploy
```

The app goes live at `https://headless-react-example--<storeId>.cdn.tagada.io/`. Large builds are zipped and uploaded for you.

## Learn more

- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)
- [Checkout flow](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow) and [offers](https://docs.tagada.io/developer-tools/headless-sdk/offers)
- [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start)

MIT licensed. Fork it freely.
