# Headless checkout in plain HTML

A full funnel (catalog and cart, checkout, thank you page with one-click upsells) in three HTML files and plain JavaScript: no React, no build step.

| | |
| --- | --- |
| **API version** | Payments V2 ([V2 or V3?](https://docs.tagada.io/payments-api/v2-or-v3)) |
| **SDKs** | `@tagadapay/headless-sdk` 1.21.0 (from jsDelivr), `@tagadapay/core-js` 3.7.0 (from jsDelivr, loaded by the Headless SDK) |
| **Minimum versions** | headless-sdk 1.21.0 as pinned, core-js 3.7.0 (the peer requirement of headless-sdk 1.21) |
| **Stack** | HTML, ES modules, any static web server |
| **Status** | Stable |
| **Tutorial** | [Checkout in plain HTML](https://docs.tagada.io/developer-tools/examples/headless-vanilla) |

<!-- Demo: add a GIF or screenshot here (docs/demo.gif). -->

## What it does

1. **Home and cart** (`index.html`): lists the products of your catalog, keeps a cart in `localStorage`, then calls `tagada.checkout.createSessionUrl({...})` and navigates to `checkout.html?checkoutToken=…&sessionToken=…`.
2. **Checkout** (`checkout.html`): reads the tokens with `CheckoutModule.parseTokensFromUrl()`, loads the session with `tagada.checkout.loadSession(...)`, collects contact, address and card, then calls `tagada.payment.processPayment({...})`, which runs 3DS and processor redirects for you.
3. **Thank you** (`thank-you.html`): shows the order and offers one-click upsells with `tagada.offers.processOfferPayment({...})`.

The checkout and thank you pages start with `tagada.payment.maybeResumeFromUrl()`, which picks up a payment coming back from a 3DS or bank redirect, polls it and cleans the URL.

## Run it in 3 steps

```bash
cd v2/headless-vanilla
npx -p @tagadapay/node-sdk tagada-init you@example.com   # 1. free sandbox store; note the VITE_STORE_ID=store_… line
#                                                          2. paste that id into assets/config.js (STORE_ID)
npx serve .                                               # 3. open the printed URL
```

There is no `.env` here: the store id is public and lives in [`assets/config.js`](./assets/config.js), next to `ENVIRONMENT` and the brand name. Any static server works; opening the files with `file://` does not, because the pages use ES modules.

Pay with the sandbox card `4242 4242 4242 4242`, any future date, any CVC.

## Files to look at

| File | What to read it for |
| --- | --- |
| [`index.html`](./index.html) | How the SDK is loaded: an import map for `@tagadapay/core-js`, then the `tagada-headless.min.js` script |
| [`assets/client.js`](./assets/client.js) | `window.TagadaHeadless.create(...)` and `CheckoutModule` |
| [`assets/home.js`](./assets/home.js) | Catalog, cart and `checkout.createSessionUrl` |
| [`assets/checkout.js`](./assets/checkout.js) | `parseTokensFromUrl`, `loadSession`, `processPayment`, `maybeResumeFromUrl` |
| [`assets/thank-you.js`](./assets/thank-you.js) | `offers.processOfferPayment` |
| [`assets/cart.js`](./assets/cart.js) | The `localStorage` cart helpers |

The SDK is loaded like this on every page:

```html
<script type="importmap">
  { "imports": { "@tagadapay/core-js": "https://cdn.jsdelivr.net/npm/@tagadapay/core-js@3.7.0/dist/index.js" } }
</script>
<script src="https://cdn.jsdelivr.net/npm/@tagadapay/headless-sdk@1.20.1/dist/tagada-headless.min.js"></script>
```

`tagada-headless.min.js` exposes `window.TagadaHeadless`. The Headless SDK imports `@tagadapay/core-js` lazily for card tokenization and 3DS; the import map points that import to the CDN. To self-host, replace both URLs with your own copies: the API is the same.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The catalog is empty | `STORE_ID` in `assets/config.js` is still `store_xxxxxx`. Paste your store id. |
| The page is blank and the console shows a module or CORS error | You opened the file directly. Serve the folder over HTTP (`npx serve .`). |
| Payment fails on a live processor | Live processors charge real cards. Use a card your processor account allows for test charges. |

## Learn more

- [Checkout in plain HTML](https://docs.tagada.io/developer-tools/examples/headless-vanilla): the step-by-step tutorial for this folder
- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)

MIT licensed. Fork it freely.
