# TagadaPay SDK Examples

Working examples for every TagadaPay client SDK. Each example is a standalone app you can run in under a minute.

## Examples

### [`headless-react/`](./headless-react/)

**Full checkout built with React hooks** — browse products, build a cart, pay, and handle upsell offers.

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
