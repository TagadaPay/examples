# vip-tag-offers

Finished app for the **[VIP tag offers](https://docs.tagada.io/developer-tools/funnel-demos/vip-tag-offers)** tutorial.

Same tee for everyone — the one-click post-purchase offer changes with the customer's CRM tags:
⭐ `vip` → Members Hoodie $39 · 🆕 no tag → Welcome Cap $14.99.

Clone this folder if you want the working project first. Walk the tutorial if you want to build the same graph yourself.

```
https://github.com/TagadaPay/examples/tree/main/vip-tag-offers
```

---

## Run it

```bash
cd vip-tag-offers
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm seed
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Toggle the persona on the landing, buy the tee, and watch the offer change.

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
/              landing — persona toggle (🆕 new / ⭐ vip) + Buy now (tee $29.99)
/checkout      pay
/offer         ONE route, two offers — picked by the simulated tags
/thank-you     main order + relatedOrders if you accepted
```

The persona toggle stands in for real CRM tags so you can walk both branches
from one browser. On a hosted funnel the same split is two edges out of the
checkout step:

- `customer.hasTag { tag: "vip" }` → Members Hoodie
- `always` (lower priority) → Welcome Cap

`scripts/seed.ts` creates the three products, the two offers, and a free shipping rate, then writes the ids into `.env`.

---

## Tutorial

- Start here: [VIP tag offers](https://docs.tagada.io/developer-tools/funnel-demos/vip-tag-offers)
- Catalog of types: [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction)
- Headless APIs used: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

License: MIT — fork freely.
