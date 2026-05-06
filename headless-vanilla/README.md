# Headless Vanilla Example

A complete checkout funnel using **plain HTML + JavaScript** (no React,
no build step) and the [TagadaPay Headless SDK](https://www.npmjs.com/package/@tagadapay/headless-sdk)
loaded from a CDN.

Demonstrates the full lifecycle:

1. **Home / Cart** (`index.html`) — list products from your catalog,
   add to cart, click checkout. Calls
   `tagada.checkout.createSessionUrl({...})` and navigates to
   `checkout.html?checkoutToken=…&sessionToken=…`.
2. **Checkout** (`checkout.html`) — read tokens via
   `CheckoutModule.parseTokensFromUrl()`, load the session, collect
   contact + address + card, then call `tagada.payment.processPayment({...})`
   which handles 3DS / processor redirects automatically.
3. **Thank-you** (`thank-you.html`) — show order info and one-click
   upsells via `tagada.offers.processOfferPayment({...})` (handles 3DS,
   redirects, and resume on return).

## Setup

This example needs no build step.

1. **Provision a demo store** (one-shot):

   ```bash
   npx -p @tagadapay/node-sdk tagada-init
   ```

   The CLI creates an organization, store, products, offers, and prints
   a `VITE_STORE_ID=store_xxxxxx` line.

2. **Edit `assets/config.js`** and paste your `STORE_ID`:

   ```js
   export const STORE_ID = 'store_xxxxxx';
   export const ENVIRONMENT = 'production';
   ```

3. **Serve the folder** (any static server works):

   ```bash
   npx serve
   ```

   Open the printed URL — the demo is live.

## Production card data

Using a real Stripe processor in production? Use a card that allows test
charges in your processor account. The Headless SDK never sees raw card
data — it tokenizes through Basis Theory directly.

## How the SDK is loaded

Each HTML page loads two scripts:

```html
<script type="importmap">
  {
    "imports": {
      "@tagadapay/core-js": "https://cdn.jsdelivr.net/npm/@tagadapay/core-js@3/dist/index.js"
    }
  }
</script>
<script src="https://cdn.jsdelivr.net/npm/@tagadapay/headless-sdk@1/dist/tagada-headless.min.js"></script>
```

- `tagada-headless.min.js` is an IIFE that exposes `window.TagadaHeadless`.
- `@tagadapay/core-js` is needed for card tokenization and 3DS modal
  challenges. The Headless SDK loads it lazily via dynamic import; the
  importmap routes that import to a CDN copy.

If your bundler / hosting can serve npm packages directly, replace the
CDN URLs with your own — the API is identical.

## What the SDK gives you for free

| Step | What you write | What the SDK does |
|---|---|---|
| Cart → Checkout | `checkout.createSessionUrl({...})` | creates session, returns ready-to-navigate URL |
| Checkout load | `CheckoutModule.parseTokensFromUrl()` + `loadSession(...)` | reads URL, fetches session, normalizes data |
| Card payment | `payment.processPayment({...})` | tokenizes, charges, runs 3DS, polls until done |
| 3DS return | `payment.maybeResumeFromUrl()` (top of every page) | detects `?paymentAction=requireAction&paymentId=…`, polls, cleans URL |
| Upsell | `offers.processOfferPayment({...})` | charges stored instrument, handles 3DS, polls |

## Files

```
headless-vanilla/
├─ index.html         # Home + cart
├─ checkout.html      # Checkout form
├─ thank-you.html     # Confirmation + upsells
├─ assets/
│  ├─ config.js       # STORE_ID + environment
│  ├─ client.js       # createHeadlessClient(...)
│  ├─ cart.js         # localStorage cart helpers
│  ├─ home.js         # index.html logic
│  ├─ checkout.js     # checkout.html logic
│  ├─ thank-you.js    # thank-you.html logic
│  └─ style.css       # minimal styling
└─ README.md
```
