# TagadaPay SDK Examples

Five working apps that show every TagadaPay client SDK in action.
Clone, run, fork — each example boots in under a minute.

---

## Pick the right example

| Example | What you get | Time to first run | SDK |
|---|---|---|---|
| [`headless-react-store/`](./headless-react-store) | A real boutique storefront — fork it and ship | **~60 s** | `headless-sdk` |
| [`headless-react/`](./headless-react) | Interactive playground that walks you through every hook | **~60 s** | `headless-sdk` |
| [`core-js-card-payment/`](./core-js-card-payment) | End-to-end card payment with 3DS return handling | **~30 s** | `core-js` |
| [`core-js-tokenization/`](./core-js-tokenization) | Card tokenization, instrument, 3DS challenge step-by-step | **~30 s** | `core-js` |
| [`apple-google-tokenization/`](./apple-google-tokenization) | Apple Pay & Google Pay buttons + tokenization | **~5 min** ¹ | `core-js` |

> ¹ Apple Pay needs HTTPS for local testing — ngrok instructions are in the example's README.

If you just want to see a real store running, **start with
[`headless-react-store`](./headless-react-store)**. Live demo:
[headless-react-store--store_6c28b7398a82.cdn.tagada.io](https://headless-react-store--store_6c28b7398a82.cdn.tagada.io/).

If you're learning the SDK hooks for the first time, start with
[`headless-react`](./headless-react) — it explains each hook with side-by-side
code panels.

---

## Zero-config setup (recommended)

The Node SDK ships a one-shot CLI that creates a fresh sandbox account,
provisions a store with demo products, and writes the API key into
`.env`. No dashboard signup needed:

```bash
cd headless-react-store          # or any of the React examples
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install && pnpm dev
```

`tagada-init` mails you a 6-digit code, verifies it, and 30 seconds
later you're shopping at <http://localhost:5173>.

> **Tagada** is the CRM (your account, your stores, your API keys).
> **TagadaPay** is one of many payment processors you can plug into it.
> The CLI provisions the former; the latter is sandbox-configured by
> default.

---

## Manual setup

Already have a TagadaPay account?

```bash
cd headless-react-store          # or any other example
pnpm install
pnpm seed YOUR_API_KEY           # creates the store + writes .env
pnpm dev
```

Get an API key from <https://app.tagada.io> →
**Settings → Access Tokens** (one-click, free, sandbox by default).

---

## Test card

All examples accept the universal sandbox card:

```
4242 4242 4242 4242   ·   12/28   ·   123
```

For 3DS scenarios, use a card with the BIN `4000 0027 6000 3184` —
core-js will route it through the BasisTheory 3DS challenge flow.

---

## Deploy any example to TagadaPay's edge CDN

The two React storefronts (`headless-react-store`, `headless-react`)
ship a deploy script that uploads the Vite build to TagadaPay's global
CDN in one command:

```bash
pnpm build
TAGADA_API_KEY=tgd_xxx pnpm deploy
```

Live URL pattern: `https://<example-name>--<storeId>.cdn.tagada.io/`.
SPA routing, asset caching, and HTTPS are handled automatically.

---

## Requirements

- Node.js 18+ (we test on 20 / 22)
- pnpm 8+ (`npm i -g pnpm`)
- A TagadaPay account — free at <https://app.tagada.io> or via `tagada-init`

---

## SDK packages used

| Package | Where it runs | Purpose |
|---|---|---|
| [`@tagadapay/headless-sdk`](https://www.npmjs.com/package/@tagadapay/headless-sdk) | Browser | Catalog, checkout, payments, offers — React hooks + vanilla JS |
| [`@tagadapay/core-js`](https://www.npmjs.com/package/@tagadapay/core-js) | Browser | Card / Apple Pay / Google Pay tokenization, 3DS challenges |
| [`@tagadapay/node-sdk`](https://www.npmjs.com/package/@tagadapay/node-sdk) | Server | Onboarding (`tagada-init`), stores / products / funnels, deploy |

---

## Documentation

- **[Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai)** — copy-paste prompts for Claude / Cursor
- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)
- [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start)
- [API reference](https://docs.tagada.io/api-reference/introduction)

---

## Contributing

These examples are intentionally short and beginner-friendly. If you spot
an outdated dependency, broken link, or unclear comment, PRs are welcome.

License: **MIT** — fork freely, ship boldly.
