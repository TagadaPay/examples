# TagadaPay examples

Small, runnable apps that show how to take payments with TagadaPay. Each one does one thing, boots in about a minute against a free sandbox account, and has a step by step tutorial on [docs.tagada.io](https://docs.tagada.io/developer-tools/examples/introduction).

The repo is split by payments API version:

| Folder | API | Who it is for | Status |
| --- | --- | --- | --- |
| [`v2/`](./v2) | **Payments V2**: the Commerce API (`https://api.tagada.io/api/public/v1`) and the SDKs below | Every merchant, every live integration today | Generally available |
| [`v3/`](./v3) | **Payments API (V3)**: `https://api.tagada.io/v1`, one Payment object driven by `next_action` | New direct integrations in the preview program | Preview, examples coming soon |

> Looking for `basic-post-purchase/` or another folder that used to sit at the root? Every existing example now lives under [`v2/`](./v2), unchanged in behavior.

## Which example do I need?

| I want to | Example | API | SDKs (version in the example) | Status |
| --- | --- | --- | --- | --- |
| Run a landing → checkout → upsell → downsell → thank you funnel | [`v2/basic-post-purchase`](./v2/basic-post-purchase) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Route the post-purchase offer by visitor region | [`v2/geo-offers`](./v2/geo-offers) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Route the offer by customer tags (VIP or new) | [`v2/vip-tag-offers`](./v2/vip-tag-offers) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Route the offer by cart value | [`v2/cart-value-upsell`](./v2/cart-value-upsell) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Fork a real looking storefront and rebrand it | [`v2/headless-react-store`](./v2/headless-react-store) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Learn the Headless React hooks one by one | [`v2/headless-react`](./v2/headless-react) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Use the Headless SDK from plain HTML (no build step) | [`v2/headless-vanilla`](./v2/headless-vanilla) | V2 | headless-sdk 1.21.0 and core-js 3.7.0 from jsDelivr | Stable |
| Build a Tagada Rx storefront on the Funnel v2 | [`v2/rx-storefront`](./v2/rx-storefront) | V2 | headless-sdk 1.21.0, core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Charge a card when you already own the order | [`v2/core-js-card-payment`](./v2/core-js-card-payment) | V2 | core-js 3.7.0 | Stable |
| Tokenize a card, run 3DS, charge (full walkthrough) | [`v2/core-js-tokenization`](./v2/core-js-tokenization) | V2 | core-js 3.7.0 | Stable |
| Add Apple Pay and Google Pay buttons | [`v2/apple-google-tokenization`](./v2/apple-google-tokenization) | V2 | core-js 3.7.0 | Stable (Apple Pay needs HTTPS) |
| Bill SaaS subscriptions from your own server | [`v2/mini-saas-billing`](./v2/mini-saas-billing) | V2 | core-js 3.7.0, node-sdk 3.27.1 | Stable |
| Create and confirm a Payment in the browser with the Payments API | [`v3/payments-browser`](./v3/payments-browser) | V3 | core-js 3.7.0 (`/payments-v3`), headless-sdk 1.21.0 | Coming soon |
| Create and capture a Payment from a Node server with the Payments API | [`v3/payments-server-node`](./v3/payments-server-node) | V3 | node-sdk (`payments.*`, not released yet) | Coming soon |

Two families inside V2:

- **Headless** (`headless-sdk`): TagadaPay owns the cart and the checkout session; you own the pages.
- **Card first** (`core-js` + `node-sdk` `payments.process()`): you already own the order and only need to charge it. Do not create a Headless checkout session for that payment.

Not sure? Read [Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration).

## V2 or V3?

**Use V2.** It is what every merchant runs today, it has a server SDK and self-serve keys, and every example in [`v2/`](./v2) works on it.

The **Payments API (V3)** is the new payments interface: one Payment object, a dated `Payments-Version` header, publishable keys (`tpk_`) in the browser and a `next_action` loop for 3DS and redirects. It is live in **Preview**: access is on request and merchants cannot create V3 keys from the dashboard yet. A store moved to V3 keeps answering V2 calls through a compatibility layer, so V2 code keeps working.

Full comparison: [V2 or V3: which one should I use?](https://docs.tagada.io/payments-api/v2-or-v3) · What V3 looks like: [`v3/`](./v3)

## Prerequisites

- **Node.js 20 or later** (`node -v`)
- **pnpm 10**: run `corepack enable` once, every example pins `pnpm@10.12.4` in `packageManager`
- **A Tagada account.** `npx -p @tagadapay/node-sdk tagada-init you@example.com` emails you a code, creates a free sandbox account with a test processor, and writes the API key to `.env`. You can also create a key in the [dashboard](https://app.tagada.io) under Settings → Access Tokens.

## Run any example in 3 steps

```bash
git clone https://github.com/TagadaPay/examples.git && cd examples/v2/basic-post-purchase
npx -p @tagadapay/node-sdk tagada-init you@example.com    # or: cp .env.example .env and fill it
pnpm install && pnpm seed && pnpm dev                      # open http://localhost:5173
```

Each example README has its exact commands. Pay with the sandbox card:

```
4242 4242 4242 4242   ·   any future date   ·   any CVC
```

A card starting with `4000 0027 6000 3184` triggers a 3DS challenge.

> **Tagada or TagadaPay?** Tagada is the commerce platform (your account, stores, API keys). TagadaPay is the payment processing behind it. `tagada-init` creates a Tagada account with a sandbox processor, so you can test payments without a bank. To charge real cards, apply for a TagadaPay account (TPA): see [`v2/headless-react-store`](./v2/headless-react-store#go-live-with-a-tagadapay-account-tpa).

## Conventions

Every example follows the same rules, so once you have read one you can read them all.

| Convention | What it means |
| --- | --- |
| One folder, one use case | Each example is self contained: its own `package.json`, lockfile, `README.md` and `.env.example`. |
| Same README template | API version, SDKs and minimum versions, Run it in 3 steps, Files to look at, Troubleshooting. |
| Pinned versions | `@tagadapay/*` packages are pinned to an exact version and the `pnpm-lock.yaml` is committed. Upgrading is a deliberate change. |
| Secrets stay out of git | `.env` is ignored; `.env.example` lists every variable with a placeholder. Variables starting with `VITE_` end up in the browser bundle: never put a secret key in one. |
| Sandbox first | Examples run against a sandbox processor. Nothing charges a real card until you plug in a live TPA. |
| Neutral demo brands | Products and brands in the examples are fictional. |

The SDKs used here:

| Package | Runs in | API | Version here | Status |
| --- | --- | --- | --- | --- |
| [`@tagadapay/headless-sdk`](https://www.npmjs.com/package/@tagadapay/headless-sdk) | Browser | V2; on a store moved to V3, 1.21.0 confirms the payment through `core-js/payments-v3` with the same calls (npm build only, not the CDN build yet) | 1.21.0 | Stable |
| [`@tagadapay/core-js`](https://www.npmjs.com/package/@tagadapay/core-js) | Browser | V2 (root export), V3 (`/payments-v3`) | 3.7.0 | Stable; `/payments-v3` is Preview |
| [`@tagadapay/node-sdk`](https://www.npmjs.com/package/@tagadapay/node-sdk) | Your server | V2 (V3 `payments.*` coming soon) | 3.27.1 | Stable |
| [`@tagadapay/plugin-sdk`](https://www.npmjs.com/package/@tagadapay/plugin-sdk) | Inside TagadaPay plugins | V2 | not used here | Legacy: use headless-sdk for new work |

Current versions and minimums for every package: [SDK versions](https://docs.tagada.io/developer-tools/sdk-versions).

## Import a demo funnel into the CRM (beta)

The four funnel examples ship a `funnel.bundle.json` (products, offers, graph). Download it, then in the dashboard open a store → Funnels → **Import bundle**, and preview from the landing step. The store needs a default payment flow.

## Learn more

- [Examples catalog](https://docs.tagada.io/developer-tools/examples/introduction): every folder and its tutorial
- [Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration)
- [Payments API (V3) overview](https://docs.tagada.io/payments-api/overview)
- [Headless SDK](https://docs.tagada.io/developer-tools/headless-sdk/introduction) · [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start) · [API reference](https://docs.tagada.io/api-reference/introduction)

## Contributing

Found a broken link, a drifted dependency or a confusing comment? Open an issue or a pull request. Keep each example small, keep the README template, and run `pnpm install --frozen-lockfile && pnpm build` in the example before you push.

MIT licensed. Fork it, rebrand it, ship it.
