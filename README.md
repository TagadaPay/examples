# TagadaPay SDK Examples

Hey! Welcome. This repo is the fastest way to see TagadaPay in action.

Small apps, each one does one thing well, all of them boot in
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
| **Walk a landing → OTO → downsell → thank you funnel** | [`basic-post-purchase/`](./basic-post-purchase) | ~60 s | `headless-sdk` |
| **Import that same funnel into the CRM (beta)** | `funnel.bundle.json` in each demo folder | ~30 s | dashboard |
| Route the post-purchase offer by visitor region (🇺🇸/🇪🇺/🌍) | [`geo-offers/`](./geo-offers) | ~60 s | `headless-sdk` |
| Route the offer by CRM tags (⭐ VIP vs 🆕 new customer) | [`vip-tag-offers/`](./vip-tag-offers) | ~60 s | `headless-sdk` |
| Route the offer by cart value (premium vs easy add-on) | [`cart-value-upsell/`](./cart-value-upsell) | ~60 s | `headless-sdk` |
| **Build a Tagada Rx storefront + install the Funnel v2** | [`rx-storefront/`](./rx-storefront) | ~60 s | `headless-sdk` + `node-sdk` |
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
cd basic-post-purchase         # or any other example here
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install && pnpm seed && pnpm dev
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

## Import a demo funnel into the CRM (beta)

Each of the four funnel demos ships a `funnel.bundle.json` (products, offers, graph). You can drop it into any store without cloning the repo:

1. Download the file from the demo folder (or from the [docs](https://docs.tagada.io/developer-tools/funnel-demos/introduction))
2. Dashboard → a store → Funnels → **Import bundle**
3. Open the **landing** step to preview (checkout alone has no cart)

The store needs a default payment flow or checkout will spin. Pixels and payment methods stay on the target account.

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

**Every example here has a step-by-step tutorial on docs.tagada.io** — the
[Examples catalog](https://docs.tagada.io/developer-tools/examples/introduction)
maps each folder to its tutorial.

- **[Tagada Rx headless storefront](https://docs.tagada.io/developer-tools/rx/headless-sdk)** — matches [`rx-storefront/`](./rx-storefront) (Funnel v2 + `tagada.rx`)
- **[Basic post-purchase funnel](https://docs.tagada.io/developer-tools/funnel-demos/basic-post-purchase)** — the tutorial that matches [`basic-post-purchase/`](./basic-post-purchase)
- **[Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction)** — the routed variations: [geo-offers](https://docs.tagada.io/developer-tools/funnel-demos/geo-offers), [vip-tag-offers](https://docs.tagada.io/developer-tools/funnel-demos/vip-tag-offers), [cart-value-upsell](https://docs.tagada.io/developer-tools/funnel-demos/cart-value-upsell)
- **[Checkout in plain HTML](https://docs.tagada.io/developer-tools/examples/headless-vanilla)** — the tutorial that matches [`headless-vanilla/`](./headless-vanilla)
- **[Card tokenization & 3DS](https://docs.tagada.io/developer-tools/examples/card-tokenization)** — matches [`core-js-tokenization/`](./core-js-tokenization) and [`core-js-card-payment/`](./core-js-card-payment)
- **[Apple Pay & Google Pay](https://docs.tagada.io/developer-tools/examples/apple-google-pay)** — matches [`apple-google-tokenization/`](./apple-google-tokenization)
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
