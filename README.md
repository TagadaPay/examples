# TagadaPay SDK Examples

Hey! Welcome. This repo is the fastest way to see TagadaPay in action.

Five small apps, each one does one thing well, all of them boot in
under a minute. Pick whichever one looks like what you're trying to
build, run two commands, and you're in.

---

## What's in here?

Not sure which path you need? Start at
[Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration).
Headless is for when TagadaPay manages the cart. If you already have the
order, use `core-js` + `payments.process` — do not also create a Headless
session for that first payment.

| If you want to… | Open this | Time | SDK |
|---|---|---|---|
| Fork a real-looking storefront and rebrand it | [`headless-react-store/`](./headless-react-store) | ~60 s | `headless-sdk` |
| Learn the React hooks one by one | [`headless-react/`](./headless-react) | ~60 s | `headless-sdk` |
| Use the SDK from plain HTML/JS (no React, no build) | [`headless-vanilla/`](./headless-vanilla) | ~30 s | `headless-sdk` |
| **Bill SaaS subscriptions (migrate from Stripe)** | [`mini-saas-billing/`](./mini-saas-billing) | ~2 min | `core-js` + `node-sdk` |
| Charge a card when you already have the order | [`core-js-card-payment/`](./core-js-card-payment) | ~30 s | `core-js` + `node-sdk` |
| Just tokenize a card (no payment) | [`core-js-tokenization/`](./core-js-tokenization) | ~30 s | `core-js` |
| Add Apple Pay or Google Pay buttons | [`apple-google-tokenization/`](./apple-google-tokenization) | ~5 min* | `core-js` |

\* Apple Pay needs HTTPS even for testing, so this one needs ngrok.
The example's README walks you through it.

**Want to see the storefront in action right now?** Click here:
[headless-react-store--store_6c28b7398a82.cdn.tagada.io](https://headless-react-store--store_6c28b7398a82.cdn.tagada.io/).
That's literally the `headless-react-store/` example, deployed.

---

## Get going in 30 seconds

The Node SDK ships a tiny CLI called `tagada-init`. It emails you a
6-digit code, verifies it, creates a free sandbox account, fills your
store with demo products, and drops the API key into `.env` for you.
No dashboard, no signup form, no copy-pasting tokens.

```bash
cd headless-react-store        # or any other example here
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install && pnpm dev
```

Open <http://localhost:5173> and you're shopping. That's it.

> **Quick naming note.** Things can get confusing because of the two
> *very* similar names:
>
> - **Tagada** is the CRM — your account, your stores, your API keys.
> - **TagadaPay** is one of many payment processors you can plug into
>   your Tagada account.
>
> `tagada-init` provisions the former and pre-configures a sandbox
> processor for you, so you can test payments without setting anything
> up. You can swap in Stripe, Adyen, etc. later from the dashboard.

---

## Already have an account?

Cool — skip the CLI, paste in your API key directly:

```bash
cd headless-react-store
pnpm install
pnpm seed YOUR_API_KEY         # builds the store + writes .env
pnpm dev
```

You can grab a key at <https://app.tagada.io> →
**Settings → Access Tokens**. Free, one click, sandbox by default.

---

## Test card

Every example accepts the universal sandbox card:

```
4242 4242 4242 4242   ·   12/28   ·   123
```

If you specifically want to play with the 3DS challenge flow, use a
card starting with `4000 0027 6000 3184` — `core-js` will trigger the
authentication dance for you.

---

## Take real payments (a TPA)

The sandbox above never touches a bank. To charge real cards you route a
store through a **TPA** (*TagadaPay Account*, `tpa_xxx`) — a KYB-approved
legal entity charging through Adyen / Stripe behind Tagada. You don't
create one; you **apply**, and Tagada provisions it after review.

The `headless-react-store` example does this end to end, from the terminal,
with the same CRM key you already have:

```bash
cd headless-react-store
pnpm apply-tpa $TAGADA_API_KEY               # 1. apply (edit your business details first)
pnpm apply-tpa $TAGADA_API_KEY --status ent_xxx   # 2. poll until approved
pnpm apply-tpa $TAGADA_API_KEY --tpas        # 3. list activated TPAs
pnpm seed $TAGADA_API_KEY --tpa tpa_xxx      # 4. plug it into the store — live
```

Full walkthrough: [headless-react-store §3b](./headless-react-store#3b--go-live-with-a-real-tagadapay-tpa).
Field reference: [Apply for TagadaPay Processing](https://docs.tagada.io/developer-tools/node-sdk/processing-applications).

---

## Want to put it on the internet?

The two React storefronts come with a one-command deploy script that
ships your Vite build to TagadaPay's edge CDN — global, HTTPS, SPA
routing, the works.

```bash
pnpm build
TAGADA_API_KEY=tgd_xxx pnpm deploy
```

You'll get back a URL that looks like
`https://<example-name>--<storeId>.cdn.tagada.io/`. Share it,
test on your phone, paste it into Slack — it's live.

If you'd rather host on Vercel or Netlify, that works too: it's a
plain Vite SPA, so push to GitHub, connect the repo, set
`VITE_STORE_ID` + `VITE_ENVIRONMENT`, and you're done.

---

## Before you start

You'll need:

- **Node.js 18+** (we test on 20 and 22)
- **pnpm 8+** — `npm i -g pnpm` if you don't have it
- A TagadaPay account — `tagada-init` will create one for free, or grab one at <https://app.tagada.io>

---

## The SDKs you'll see

| Package | Where it runs | What it does |
|---|---|---|
| [`@tagadapay/headless-sdk`](https://www.npmjs.com/package/@tagadapay/headless-sdk) | Browser | Catalog, checkout, payments, upsells — React hooks plus vanilla JS |
| [`@tagadapay/core-js`](https://www.npmjs.com/package/@tagadapay/core-js) | Browser | Card / Apple Pay / Google Pay tokenization + 3DS challenges |
| [`@tagadapay/node-sdk`](https://www.npmjs.com/package/@tagadapay/node-sdk) | Server | `tagada-init`, plus stores / products / funnels / deploy |

---

## Want to read more?

- **[Choose how you accept payments](https://docs.tagada.io/developer-tools/payments/choose-your-integration)** — Headless vs core-js vs Plugin vs `payments.process`
- **[Build a Store with AI + TagadaPay](https://docs.tagada.io/developer-tools/headless-sdk/build-store-with-ai)** — paste these prompts into Claude or Cursor
- [Headless SDK introduction](https://docs.tagada.io/developer-tools/headless-sdk/introduction)
- [Node SDK quick start](https://docs.tagada.io/developer-tools/node-sdk/quick-start)
- [API reference](https://docs.tagada.io/api-reference/introduction)

---

## Spot something off?

These examples are meant to stay tiny and friendly. If a dependency
drifted, a link's dead, or a comment doesn't make sense — open a PR or
an issue, we'll get to it. Pull requests welcome from anyone.

Made with care, MIT licensed — fork it, rebrand it, ship it.
