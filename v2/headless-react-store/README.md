# Headless React store

A fork-ready boutique storefront (catalog, cart drawer, one-page checkout, one-click upsells) that you can rebrand and ship in a day.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.21.0, `@tagadapay/core-js` 3.7.0, `@tagadapay/node-sdk` 3.27.1 (seed, apply and deploy scripts) |
| **Minimum versions** | headless-sdk 1.6.0, core-js 3.0.0 (with headless-sdk 1.21 or later, core-js 3.7.0 or later, its peer requirement); the scripts are tested on node-sdk 3.27.1 |
| **Stack** | Vite 7, React 19, React Router 6, Tailwind 3, TypeScript, Node 20+ for the scripts |
| **Status** | Stable |
| **Tutorial** | [Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai) |
| **Live demo** | [headless-react-store--store_6c28b7398a82.cdn.tagada.io](https://headless-react-store--store_6c28b7398a82.cdn.tagada.io/) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

Unlike the playground in [`../headless-react`](../headless-react), this is not a tutorial: no code panels, no step indicators. It looks and behaves like a real store you can hand to a designer or to an AI assistant.

| | |
| --- | --- |
| **Cart** | Slide-out drawer, quick add and a full cart page, kept in `localStorage` |
| **Checkout** | One page: contact, shipping address, shipping rate, promo code, card, no redirect |
| **Payments** | Headless SDK with 3DS, sandbox processor by default, a real TagadaPay account (TPA) when you are ready |
| **Upsells** | One-click post-purchase offers on the thank you page |

## Run it in 3 steps

```bash
cd v2/headless-react-store
npx -p @tagadapay/node-sdk tagada-init you@example.com   # 1. free sandbox account and demo store, writes .env
pnpm install                                              # 2. install
pnpm dev                                                  # 3. open http://localhost:5173
```

`tagada-init` emails you a 6-digit code, creates a sandbox account with a store, two demo products, an upsell, a shipping rate, a sandbox processor and a checkout funnel, then writes `TAGADA_API_KEY`, `TAGADA_STORE_ID` and `VITE_STORE_ID` to `.env`.

Already have an API key? Run `pnpm seed YOUR_API_KEY` instead of step 1: it builds a richer apparel catalog and writes `.env` (see [`.env.example`](./.env.example)). Keys live in the dashboard under Settings → Access Tokens.

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`src/App.tsx`](./src/App.tsx) | `TagadaHeadlessProvider` and the routes |
| [`src/pages/Home.tsx`](./src/pages/Home.tsx), [`src/pages/Product.tsx`](./src/pages/Product.tsx) | `useCatalog` and `loadProducts` |
| [`src/lib/use-start-checkout.ts`](./src/lib/use-start-checkout.ts) | `useHeadlessClient` and `client.checkout.createSessionUrl({ items })` from the cart |
| [`src/pages/Checkout.tsx`](./src/pages/Checkout.tsx) | `useCheckout` (`updateCustomer`, `updateAddress`, `getShippingRates`, `selectShippingRate`, `applyPromo`) and `usePayment` (`tokenizeCard`, `processPayment`) |
| [`src/pages/ThankYou.tsx`](./src/pages/ThankYou.tsx) | `useOffers`: `listOffers`, `previewOffer`, `processOfferPayment` |
| [`src/lib/config.ts`](./src/lib/config.ts) | Brand name, tagline, free shipping threshold, env vars |
| [`scripts/seed.ts`](./scripts/seed.ts) | Node SDK: processor, payment flow, store, products, offers, funnel |
| [`scripts/apply-tpa.ts`](./scripts/apply-tpa.ts) | Node SDK: apply for a TagadaPay account and list activated ones |
| [`scripts/deploy.ts`](./scripts/deploy.ts) | Node SDK: deploy the build to the TagadaPay CDN |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The catalog stays empty | `VITE_STORE_ID` is missing from `.env`. Run `tagada-init` or `pnpm seed YOUR_API_KEY`, then restart `pnpm dev`. |
| `pnpm seed` prints the usage line | Pass the key as the first argument: `pnpm seed YOUR_API_KEY`. The script does not read it from `.env`. |
| `pnpm seed --tpa` says "No tagadapay-router processor found" | The TPA is not activated yet. Check it with `pnpm apply-tpa YOUR_API_KEY --status ent_xxx`. |
| `pnpm deploy` says "Missing TAGADA_API_KEY" | Pass it inline: `TAGADA_API_KEY=... pnpm deploy`. Set `TAGADA_STORE_ID` too if the account has several stores. |

## Going further

### Seed your own catalog

[`scripts/seed.ts`](./scripts/seed.ts) is the single source of truth for the store's content. Edit the `PRODUCTS` array near the top, then run `pnpm seed YOUR_API_KEY` again: it creates a fresh store, products, upsells, payment flow and funnel, and overwrites `.env` with the new store id.

```ts
const PRODUCTS: SeedProduct[] = [
  {
    name: 'My product',
    description: '…',
    sku: 'sku-001',
    imageUrl: 'https://your-cdn.example.com/product-1.jpg',
    priceCents: 4800,       // $48.00
    compareAtCents: 6500,   // strike-through reference
    priceCentsEur: 4500,    // optional EUR override
    grams: 320,
  },
];
```

### Go live with a TagadaPay account (TPA)

The default seed uses a sandbox processor that never touches a bank. To charge real cards you route the store through a **TPA** (TagadaPay Account, `tpa_xxx`): a KYB-approved legal entity that charges through an acquirer behind Tagada. You do not create a TPA, you apply for one, and Tagada provisions it after review. [`scripts/apply-tpa.ts`](./scripts/apply-tpa.ts) drives the whole journey with the same API key:

```bash
pnpm apply-tpa $TAGADA_API_KEY                  # 1. apply (edit the APPLICATION object first)
pnpm apply-tpa $TAGADA_API_KEY --status ent_xxx # 2. poll until approved
pnpm apply-tpa $TAGADA_API_KEY --tpas           # 3. list activated TPAs
pnpm seed $TAGADA_API_KEY --tpa tpa_xxx         # 4. route the store through it
```

Only the business name and country plus the representative's first name, last name and email are required, but a complete application (IDs, VAT, bank, documents) is approved much faster; `apply-tpa` lists what is still missing. Field reference: [Apply for TagadaPay Processing](https://docs.tagada.io/developer-tools/node-sdk/processing-applications).

How it plugs in: an activated TPA appears as a `tagadapay-router` processor that Tagada creates for you. In `--tpa` mode the seed looks that processor up (instead of creating a sandbox one), builds a payment flow on it, and sets the store's `selectedPaymentFlowId`. Keep `threeDsEnabled: false` on that flow: the acquirer runs its own 3DS. Charges are real, so refund your test orders (dashboard, or `tagada.payments.refund({ paymentIds })`). Routing across several TPAs: [Payment flows](https://docs.tagada.io/developer-tools/node-sdk/multi-stripe-routing).

### Customise the brand

Two files own the look: [`src/lib/config.ts`](./src/lib/config.ts) (`BRAND.name`, `BRAND.tagline`, `FREE_SHIPPING_THRESHOLD_CENTS`) and [`tailwind.config.js`](./tailwind.config.js) (the `ink-*` palette, Inter and Fraunces fonts). Change the name, swap the fonts in `index.html`, and the whole site reskins.

### Deploy

To the TagadaPay edge CDN:

```bash
pnpm build
TAGADA_API_KEY=your_api_key pnpm deploy
```

The store goes live at `https://headless-react-store--<storeId>.cdn.tagada.io/`. It is also a plain Vite SPA: push it to Vercel or Netlify and set `VITE_STORE_ID` and `VITE_ENVIRONMENT`.

### Rebuild it with an AI assistant

Every file does one thing and carries a short doc comment that says what, and the SDK calls live in a handful of files (`Home.tsx`, `use-start-checkout.ts`, `Checkout.tsx`, `ThankYou.tsx`). A prompt that works:

> Open `v2/headless-react-store`. Replace the apparel theme with a coffee shop: house blend beans (250 g, $24), an espresso cup ($32) and a monthly "Beans Club" subscription at $35. Update the products in `scripts/seed.ts`, set `BRAND.name` to "ORBIT" and the tagline to "Roasted weekly. Shipped Monday." Do not touch the checkout or the hooks.

## Learn more

- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)
- [Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai)
- [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start)

MIT licensed. Fork it freely.
