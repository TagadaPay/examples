# headless-react-store

A real-looking storefront template built on the [TagadaPay Headless SDK](https://www.npmjs.com/package/@tagadapay/headless-sdk).
Fork it, rebrand it, ship it in a day.

```
┌───────────────────────────────────────────────────┐
│  React Router · Tailwind · TypeScript · Vite      │
│  Cart in localStorage  →  TagadaPay Headless SDK  │
└───────────────────────────────────────────────────┘
```

Unlike the playground at [`../headless-react`](../headless-react), this package
is **not a tutorial**. There are no code panels, no step indicators, no
"Getting Started" overlays. It looks and behaves like a real boutique store
that you can hand to a designer or paste into Claude and iterate on.

| | |
|---|---|
| **Stack** | React 19, React Router 6, Vite 7, Tailwind 3, TypeScript |
| **Cart** | `localStorage`, persists across reloads |
| **Checkout** | Single page — contact + shipping + payment, no redirect |
| **Payments** | TagadaPay Headless SDK (3DS, multi-PSP, sandbox supported) |
| **Upsells** | Post-purchase, one-click on the thank-you page |
| **Lines of code** | ~1,200 across ~15 files |

---

## 1 · Set up

**Easiest path — one command, no browser:**

```bash
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm dev
```

`tagada-init` mails you a 6-digit code, verifies it, creates a fresh
sandbox **Tagada** account, provisions a store with six demo products,
two upsells, a sandbox processor, and a checkout funnel — then writes
`TAGADA_API_KEY` / `TAGADA_STORE_ID` / `TAGADA_ACCOUNT_ID` to `.env`.
Open [localhost:5173](http://localhost:5173) and you're shopping.

<details>
<summary>Or use the classic web flow</summary>

If you'd rather sign up via the dashboard:

```bash
pnpm install
pnpm seed YOUR_API_KEY     # creates the store + writes .env
pnpm dev
```

Get the API key at [app.tagada.io](https://app.tagada.io/sign-up?source=examples-headless-react-store)
→ **Settings → Access Tokens**.

</details>

> **Tagada** is the CRM (your account, your stores, your API keys).
> **TagadaPay** is the payment processor — one PSP among many you can
> plug into your Tagada account. The CLI provisions the former; the
> latter is sandbox-configured by default and can be swapped for Stripe
> et al. from the dashboard.

### Test card

```
4242 4242 4242 4242   ·   12/28   ·   123
```

---

## 2 · How it's wired

```
src/
├── App.tsx                 ← TagadaHeadlessProvider + React Router
├── main.tsx                ← entry
├── index.css               ← Tailwind
├── components/
│   ├── Layout.tsx          ← header (logo + cart) + footer
│   └── ProductCard.tsx     ← used in the home grid
├── pages/
│   ├── Home.tsx            ← hero + product grid (useCatalog)
│   ├── Product.tsx         ← product detail + add-to-cart
│   ├── Cart.tsx            ← localStorage cart, "Checkout" button
│   ├── Checkout.tsx        ← contact + address + shipping + payment
│   └── ThankYou.tsx        ← confirmation + post-purchase upsells
├── lib/
│   ├── cart.ts             ← useCart() — localStorage hook
│   ├── config.ts           ← brand + env vars
│   └── format.ts           ← formatPrice() helper
└── scripts/
    ├── seed.ts             ← Node SDK — creates store/products/funnel
    └── deploy.ts           ← Node SDK — deploys to TagadaPay edge CDN
```

### The four hook calls that do all the work

| Page | Hook | What it does |
|---|---|---|
| `Home.tsx` | `useCatalog()` | `loadProducts()` to render the grid |
| `Cart.tsx` | `useHeadlessClient()` | `client.checkout.createSession({ items })` returns checkout tokens |
| `Checkout.tsx` | `useCheckout()` + `usePayment()` | `updateCustomer`, `updateAddress`, `getShippingRates`, `selectShippingRate`, `applyPromo`, `tokenizeCard`, `processPayment` |
| `ThankYou.tsx` | `useOffers()` | `listOffers({ type: 'upsell' })` + `payPreviewedOffer({ mainOrderId })` for one-click upsells |

That's the whole SDK surface used by this store. Everything else is regular
React + Tailwind.

---

## 3 · Seed your own catalog (Node SDK)

The `scripts/seed.ts` file is your *single source of truth* for what's
inside your store. To replace the demo apparel with your own products, edit
the `PRODUCTS` array near the top of that file.

```ts
const PRODUCTS: SeedProduct[] = [
  {
    name: 'My amazing product',
    description: '…',
    sku: 'sku-001',
    imageUrl: 'https://your-cdn.example.com/product-1.jpg',
    priceCents: 4800,         // $48.00
    compareAtCents: 6500,     // strike-through reference
    priceCentsEur: 4500,      // optional EUR override
    grams: 320,
  },
  // …add as many as you like
];
```

Then re-run:

```bash
pnpm seed YOUR_API_KEY
```

The script will create a fresh store, products, upsells, payment flow, and
funnel — and overwrite `.env` with the new store ID. Reload the dev server
and your new catalog appears.

### What seed.ts actually does (Node SDK calls)

```ts
import Tagada from '@tagadapay/node-sdk';
const tagada = new Tagada(API_KEY);

// 1. A processor — sandbox now, swap for stripe/adyen/etc. later
const { processor } = await tagada.processors.create({ processor: { type: 'sandbox', /* … */ } });

// 2. A payment flow — routes payments to one or more processors
const flow = await tagada.paymentFlows.create({ data: { /* processorConfigs */ } });

// 3. The store
const store = await tagada.stores.create({ name: 'My Store', selectedPaymentFlowId: flow.id });

// 4. Products with variants + multi-currency prices
await tagada.products.create({
  storeId: store.id,
  name: 'Heavyweight Tee',
  variants: [{ sku: 'tee-stone', price: 4800, prices: [{ currencyOptions: { USD: { amount: 4800 } } }] }],
});

// 5. Upsell offers (post-purchase, one-click)
await tagada.offers.create({
  storeId: store.id,
  type: 'upsell',
  triggers: [{ productId: null, type: 'any' }],
  offers: [{ productId, variantId, priceId, title: 'Add a Canvas Tote — 25% off' }],
});

// 6. The checkout funnel — defines the URL paths and which step uses which payment flow
await tagada.funnels.create({ storeId: store.id, config: { /* nodes & edges */ }, isDefault: true });
```

Read the full file at [`scripts/seed.ts`](./scripts/seed.ts) — it's heavily
commented and ~280 lines.

---

## 4 · Customise the brand

Two files own the look:

- **`src/lib/config.ts`** — store name, tagline, free-shipping threshold
- **`tailwind.config.js`** — colour palette (currently neutral `ink-*` tokens)
  and fonts (Inter + Fraunces)

Replace `BRAND.name`, drop a different font in `index.html`, and the whole
site reskins.

```ts
// src/lib/config.ts
export const BRAND = {
  name: 'NORTH',                       // ← your store name
  tagline: 'Considered apparel for every season.',
  emailReplyTo: 'hello@example.com',
};

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;  // ← $50
```

---

## 5 · Deploy

### To the TagadaPay edge CDN (one command)

```bash
pnpm build
TAGADA_API_KEY=tgd_xxx pnpm deploy
```

Your store will be live at:
`https://headless-react-store--{storeId}.cdn.tagada.io/`

### To Vercel / Netlify

It's a vanilla Vite SPA — push to GitHub, connect, set the env vars
(`VITE_STORE_ID`, `VITE_ENVIRONMENT`) and you're live.

---

## 6 · Reproducing this with Claude

This template is intentionally Claude-friendly. Each file does one thing,
files are short, and the SDK calls are concentrated in a handful of pages
(`Cart.tsx`, `Checkout.tsx`, `ThankYou.tsx`, `Home.tsx`).

A prompt that works:

> *Open `examples-sdk/headless-react-store`. Replace the apparel theme with
> a coffee-shop theme: house blend beans (250g, $24), espresso cup (ceramic,
> $32), and a monthly subscription "Beans Club" at $35/mo. Update the
> products in `scripts/seed.ts`, change `BRAND.name` to "ORBIT" and the
> tagline to "Roasted weekly. Shipped Monday." Don't touch the checkout or
> hooks.*

Claude will know where to edit because every file has a one-line
docstring at the top describing its job.

---

## SDK packages used

| Package | Purpose |
|---|---|
| [`@tagadapay/headless-sdk`](https://www.npmjs.com/package/@tagadapay/headless-sdk) | Catalog, checkout, payment, offers (browser) |
| [`@tagadapay/core-js`](https://www.npmjs.com/package/@tagadapay/core-js) | Card tokenization (peer dependency) |
| [`@tagadapay/node-sdk`](https://www.npmjs.com/package/@tagadapay/node-sdk) | Server-side store/product/funnel management (seed + deploy scripts) |

---

## Documentation

- [Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai)
- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)
- [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start)

License: MIT — fork freely.
