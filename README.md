# TagadaPay SDK Examples

Working examples for every TagadaPay client SDK. Each example is a standalone app you can run in under a minute.

## Examples

### [`headless-react-store/`](./headless-react-store/)

**A real-looking storefront** you can fork and rebrand — multi-page boutique with localStorage cart and a single-page professional checkout. No tutorial overlays, no code panels: just a production-ready template.

```bash
cd headless-react-store
pnpm install
pnpm seed <API_KEY>   # Creates store + 6 products + upsells + funnel
pnpm dev
```

Pages: home / product / cart / checkout / thank-you. Apparel-themed seed by default — edit `scripts/seed.ts` to swap in your own catalog.

Deploy to TagadaPay CDN: `pnpm build && TAGADA_API_KEY=xxx pnpm deploy`

---

### [`headless-react/`](./headless-react/)

**Interactive playground / tutorial** — every Headless SDK hook explained step-by-step with side-by-side code panels. The fastest way to *learn* the SDK before forking the storefront template above.

```bash
cd headless-react
pnpm install
pnpm seed <API_KEY>   # Creates store + products + offers + processor in one command
pnpm dev
```

Hooks demonstrated: `useCatalog`, `useCheckout`, `usePayment`, `useOffers`, `useHeadlessClient`

Deploy to TagadaPay CDN: `pnpm build && TAGADA_API_KEY=xxx pnpm deploy`

---

### [`core-js-tokenization/`](./core-js-tokenization/)

**Card tokenization flow** — tokenize a card, create a payment instrument, and process a payment using `@tagadapay/core-js`.

```bash
cd core-js-tokenization
pnpm install
pnpm dev
```

---

### [`apple-google-tokenization/`](./apple-google-tokenization/)

**Apple Pay & Google Pay** — tokenize wallets via `@tagadapay/core-js` and process payments.

```bash
cd apple-google-tokenization
pnpm install
pnpm dev
```

---

## Requirements

- Node.js 18+
- [TagadaPay account](https://app.tagadapay.com) + API key (Settings → Access Tokens)

## Documentation

- [Headless SDK Guide](https://docs.tagadapay.com/developer-tools/headless-sdk/introduction)
- [Node SDK Quick Start](https://docs.tagadapay.com/developer-tools/node-sdk/quick-start)
- [API Reference](https://docs.tagadapay.com/api-reference/introduction)
