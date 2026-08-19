# basic-post-purchase

Finished app for the **[Basic post-purchase](https://docs.tagada.io/developer-tools/funnel-demos/basic-post-purchase)** tutorial.

Landing → checkout → cap OTO → cap downsell → tote OTO → thank you (`relatedOrders`).

Clone this folder if you want the working project first. Walk the tutorial if you want to build the same graph yourself.

```
https://github.com/TagadaPay/examples/tree/main/basic-post-purchase
```

**CRM import (beta):** [`funnel.bundle.json`](./funnel.bundle.json) → Funnels → **Import bundle**. Preview from the landing step. The store needs a default payment flow.

---

## Run it

```bash
cd basic-post-purchase
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm seed
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Buy the tee, then accept or decline the offers.

Already have a key?

```bash
pnpm install
pnpm seed YOUR_API_KEY
pnpm dev
```

### Test card

```
4242 4242 4242 4242   ·   12/28   ·   123
```

---

## What you will see

```
/              landing — Buy now creates a checkout session (tee $29.99)
/checkout      pay
/offer         cap $19.99 — Yes → tote, No → downsell
/downsell      cap $14.99 — Yes → tote, No → thank you
/offer-tote    tote $24 — Yes or No → thank you
/thank-you     main order + relatedOrders (one child order per accept)
```

`scripts/seed.ts` creates the four products, the three offers, and a free shipping rate, then writes the ids into `.env`.

---

## Tutorial

- Start here: [Basic post-purchase](https://docs.tagada.io/developer-tools/funnel-demos/basic-post-purchase)
- Catalog of types: [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction)
- Headless APIs used: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

License: MIT — fork freely.
