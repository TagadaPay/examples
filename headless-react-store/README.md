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
| **Cart** | Slide-out drawer + quick-add + full page, `localStorage`, persists across reloads |
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
sandbox **Tagada** account, provisions a store with two demo products
(an *Essential Tee* in 3 colorways and an *Essential Cap*), a checkout
upsell, a default shipping rate, a sandbox processor, and a checkout
funnel — then writes `TAGADA_API_KEY` / `TAGADA_STORE_ID` /
`TAGADA_ACCOUNT_ID` to `.env`. Open
[localhost:5173](http://localhost:5173) and you're shopping.

> Want a richer 6-product apparel catalog instead of the 2-product
> default? After `tagada-init`, run `pnpm seed $TAGADA_API_KEY` to
> extend the demo using `scripts/seed.ts`.

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
> et al. from the dashboard. To take **live payments through a real
> Adyen/Stripe merchant account (TPA)**, see [§3b](#3b--use-a-real-tagadapay-tpa-take-live-payments).

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
│   ├── Layout.tsx          ← header (nav + cart) + mobile menu + footer
│   ├── ProductCard.tsx     ← home-grid tile with hover "Quick add"
│   ├── CartDrawer.tsx      ← slide-out mini-cart (open on add / cart click)
│   └── FreeShippingBar.tsx ← progress-to-free-shipping nudge
├── pages/
│   ├── Home.tsx            ← hero + product grid (useCatalog)
│   ├── Product.tsx         ← product detail + add-to-cart (opens drawer)
│   ├── Cart.tsx            ← localStorage cart, "Checkout" button
│   ├── Checkout.tsx        ← contact + address + shipping + payment
│   └── ThankYou.tsx        ← confirmation + post-purchase upsells
├── lib/
│   ├── cart.ts             ← useCart() — localStorage cart data
│   ├── cart-ui.tsx         ← useCartUI() — drawer open/close state
│   ├── use-start-checkout.ts ← createSession + navigate to /checkout
│   ├── config.ts           ← brand + env vars
│   └── format.ts           ← formatPrice() helper
└── scripts/
    ├── seed.ts             ← Node SDK — creates store/products/funnel (+ --tpa)
    ├── apply-tpa.ts        ← Node SDK — apply for a real TPA & list activated ones
    └── deploy.ts           ← Node SDK — deploys to TagadaPay edge CDN
```

### The four hook calls that do all the work

| Page | Hook | What it does |
|---|---|---|
| `Home.tsx` | `useCatalog()` | `loadProducts()` to render the grid |
| `Cart.tsx` / `CartDrawer.tsx` | `useStartCheckout()` → `useHeadlessClient()` | `client.checkout.createSessionUrl({ items })` returns a self-hosted checkout URL |
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

## 3b · Go live with a real TagadaPay TPA

The default seed wires a **sandbox** processor — great for building, but it
never touches a bank. To accept real money you route the store through a
**TPA** (*TagadaPay Account*, id `tpa_xxx`): a KYB-approved legal entity that
charges real cards through an acquirer (Adyen / Stripe) sitting behind Tagada.

Once you *have* an activated TPA, plugging it in is a one-word change:

```bash
pnpm seed YOUR_API_KEY --tpa tpa_xxxxxxxxxxxx
```

The store, products, funnel, and checkout code are identical — payments just
flow through your TPA's PSP (with the PSP's own 3DS) instead of the sandbox.

### Don't have a TPA yet? Apply for one — from the terminal

You don't *create* a TPA; you **apply** for one and Tagada provisions it after
KYB. The bundled [`scripts/apply-tpa.ts`](./scripts/apply-tpa.ts) drives the
whole journey with the **same `sk_crm_…` key** the seed uses. Nothing here
touches the dashboard.

```bash
# 0. Get a Tagada account + CRM key (if you don't have one).
#    tagada-init writes it to .env as TAGADA_API_KEY.
npx -p @tagadapay/node-sdk tagada-init you@example.com

# 1. APPLY — edit the APPLICATION object at the top of scripts/apply-tpa.ts
#    with your real business + representative + bank, then:
pnpm apply-tpa $TAGADA_API_KEY
#    → prints an application id (ent_xxx) and any recommended fields still missing

# 2. CHECK — poll until our team approves it and provisions your TPA
pnpm apply-tpa $TAGADA_API_KEY --status ent_xxx
#    → status: submitted → in_review → approved, and tpaId gets populated

# 3. LIST — once activated, print your ready-to-use TPA(s) + the seed command
pnpm apply-tpa $TAGADA_API_KEY --tpas
#    → • tpa_xxx  processor proc_xxx
#      pnpm seed $TAGADA_API_KEY --tpa tpa_xxx

# 4. GO LIVE — plug it into the store
pnpm seed $TAGADA_API_KEY --tpa tpa_xxx
pnpm dev
```

That's the complete arc: **account → application → approval → TPA → live store**.
Only 5 fields are strictly required to apply (business name + country, and the
rep's first/last name + email), but a *complete* application (IDs, VAT, bank,
documents) is approved far faster — `apply-tpa` echoes whatever is still
missing. Full field reference:
[Apply for TagadaPay Processing](https://docs.tagada.io/developer-tools/node-sdk/processing-applications).

### How a TPA plugs in

A TPA isn't a processor you create — it's surfaced to the API as a
**`tagadapay-router`** processor that Tagada **auto-creates when the TPA is
activated**. So the seed script doesn't create a processor in `--tpa` mode; it
*looks one up*:

```ts
// Find the router processor that maps to your TPA
const { processors } = await tagada.processors.list();
const router = processors.find(
  (p) => p.type === 'tagadapay-router' && p.options?.tagadapayAccountId === 'tpa_xxx',
);

// Route a payment flow through it, then bind it to the store
const flow  = await tagada.paymentFlows.create({
  data: { name: 'TPA Flow', strategy: 'simple',
          processorConfigs: [{ processorId: router.id, weight: 100 }] /* … */ },
});
const store = await tagada.stores.create({ /* … */, selectedPaymentFlowId: flow.id });
```

<details>
<summary>Requirements & gotchas</summary>

- The **TPA must belong to the same account** as your API key, and be
  **activated** — activation is what auto-creates the `tagadapay-router`
  processor. If the seed says *"No tagadapay-router processor found"*, the TPA
  isn't activated yet (still in review or provisioning — check with
  `pnpm apply-tpa <key> --status <ent_id>`).
- The store's **`selectedPaymentFlowId`** must point at the flow — this link is
  **not** automatic when a TPA is created. The seed sets it for you.
- Leave **`threeDsEnabled: false`** on the flow. The PSP/acquirer behind the TPA
  runs its own hosted 3DS on redirect; Tagada's `threeDsEnabled` toggles the
  *standalone* 3DS flow, which you rarely need.
- **Real charges.** Use a real card and refund your test orders (from the
  dashboard, or `tagada.payments.refund({ paymentIds })`).

</details>

More on multi-TPA routing (cascade & weighted) in the
[Payment Flows docs](https://docs.tagada.io/developer-tools/node-sdk/multi-stripe-routing).

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
