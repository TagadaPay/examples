# cart-value-upsell

Finished app for the **[Cart-value upsell](https://docs.tagada.io/developer-tools/funnel-demos/cart-value-upsell)** tutorial.

The order total picks the one-click post-purchase offer:
≥ $50 → Heavyweight Hoodie $39 (premium) · below → Crew Socks $9 (easy add-on).

Clone this folder if you want the working project first. Walk the tutorial if you want to build the same graph yourself.

```
https://github.com/TagadaPay/examples/tree/main/cart-value-upsell
```

**CRM import (beta):** [`funnel.bundle.json`](./funnel.bundle.json) → Funnels → **Import bundle**. Preview from the landing step. The store needs a default payment flow.

---

## Run it

```bash
cd cart-value-upsell
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm seed
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Buy 1 tee, see the socks. Buy 2 tees, see the hoodie.

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
/              landing — cart size (1 tee $29.99 / 2 tees $59.98) + Buy now
/checkout      pay
/offer         ONE route, two offers — picked from the REAL order total
/thank-you     main order + relatedOrders if you accepted
```

Unlike the geo and tag demos, nothing is simulated here: `/offer` loads the
main order with `useOrder(orderId)` and branches on `order.amount`. On a
hosted funnel the same split is two edges out of the checkout step:

- `mainOrder.totalGreaterThan { amount: 5000 }` → hoodie
- `always` (lower priority) → socks

`scripts/seed.ts` creates the three products, the two offers, and a free shipping rate, then writes the ids into `.env`.

---

## Tutorial

- Start here: [Cart-value upsell](https://docs.tagada.io/developer-tools/funnel-demos/cart-value-upsell)
- Catalog of types: [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction)
- Headless APIs used: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

License: MIT — fork freely.
