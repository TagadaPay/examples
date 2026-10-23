# Payments V2 examples

Payments V2 is what every TagadaPay merchant runs today: the Commerce API at `https://api.tagada.io/api/public/v1` (`checkout/pay-v2`, `payments/process`, `threeds/*`), with the Headless SDK in the browser and the Node SDK on your server. It is generally available, has self-serve keys, and keeps working on a store moved to the [Payments API (V3)](../v3).

Every example below installs from its lockfile, builds, and runs against a free sandbox account.

## Headless: TagadaPay owns the cart

| Example | What it shows | SDKs |
| --- | --- | --- |
| [`basic-post-purchase`](./basic-post-purchase) | Landing → checkout → offer → downsell → thank you | headless-sdk 1.20.1, core-js 3.7.0, node-sdk 3.27.1 |
| [`geo-offers`](./geo-offers) | The offer changes with the visitor's region | same |
| [`vip-tag-offers`](./vip-tag-offers) | The offer changes with the customer's tags | same |
| [`cart-value-upsell`](./cart-value-upsell) | The offer changes with the order total | same |
| [`headless-react-store`](./headless-react-store) | A complete storefront to rebrand, deploy, and take live | same |
| [`headless-react`](./headless-react) | Every React hook, one step at a time | same |
| [`headless-vanilla`](./headless-vanilla) | The same checkout in plain HTML, no build | headless-sdk 1.20.1, core-js 3.7.0 (CDN) |
| [`rx-storefront`](./rx-storefront) | A Tagada Rx storefront that installs the Funnel v2 | headless-sdk 1.20.1, core-js 3.7.0, node-sdk 3.27.1 |

## Card first: you own the order

| Example | What it shows | SDKs |
| --- | --- | --- |
| [`core-js-card-payment`](./core-js-card-payment) | One card form, one charge, 3DS when needed | core-js 3.7.0 |
| [`core-js-tokenization`](./core-js-tokenization) | Tokenize, payment instrument, 3DS session, charge, step by step | core-js 3.7.0 |
| [`apple-google-tokenization`](./apple-google-tokenization) | Apple Pay and Google Pay buttons to a payment instrument | core-js 3.7.0 |
| [`mini-saas-billing`](./mini-saas-billing) | Plans, trials and rebills from your own Express server | core-js 3.7.0, node-sdk 3.27.1 |

Prerequisites, conventions and the V2 or V3 question: see the [root README](../README.md).
