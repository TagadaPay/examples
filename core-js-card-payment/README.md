# Minimal Card Payment

> 📘 **Step-by-step tutorial:** [Card tokenization & 3DS](https://docs.tagada.io/developer-tools/examples/card-tokenization#the-minimal-variant)

The smallest possible **"you already have the order"** payment with
`@tagadapay/core-js`: one page, one card form, one charge — plus a
`/return` route showing how to resume after a processor redirect.

This is the skeleton version of [`../core-js-tokenization`](../core-js-tokenization),
which demonstrates the same flow with a narrated UI (token history,
SCA detection, 3DS retry). **Read that one to learn; copy this one to ship.**

## Quick Start

```bash
pnpm install
pnpm run dev
```

Open http://localhost:5173, paste your store id and API settings, and pay
with a [sandbox test card](https://docs.tagada.io/developer-tools/node-sdk/sandbox-testing).

## The flow

1. **Tokenize** the card in the browser (`tokenizeCard()` → `TagadaToken`) —
   raw card data goes to Basis Theory, never to your server.
2. **Create a payment instrument** from the token (server-side, with your API key).
3. **Charge** via `payments.process`, handling 3DS / redirects when required.
4. **Resume** on `/return?paymentId=…` after a processor redirect.

> ⚠️ The demo calls the API from the browser so you can watch the flow on
> one page. In production, steps 2–3 move behind your own backend — your
> API key must never ship to the client.

## Related

- [`../core-js-tokenization`](../core-js-tokenization) — the narrated version of this flow
- [`../apple-google-tokenization`](../apple-google-tokenization) — same charge path, wallet buttons
- [core-js reference](https://docs.tagada.io/developer-tools/payments/core-js-payments)
