# geo-offers

Finished app for the **[Geo-based offers](https://docs.tagada.io/developer-tools/funnel-demos/geo-offers)** tutorial.

Same tee for everyone — the one-click post-purchase offer changes with the visitor's region:
🇺🇸 Varsity Cap $19.99 · 🇪🇺 Alpine Beanie $17.99 · 🌍 Travel Tote $24.

Clone this folder if you want the working project first. Walk the tutorial if you want to build the same graph yourself.

```
https://github.com/TagadaPay/examples/tree/main/geo-offers
```

---

## Run it

```bash
cd geo-offers
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm seed
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Pick a region on the landing, buy the tee, and watch the offer change.

---

## Or import the funnel in the CRM (beta)

[`funnel.bundle.json`](./funnel.bundle.json) is the same graph as a portable bundle (products, offers, steps).

1. CRM → a store → Funnels
2. **Import bundle** → pick `funnel.bundle.json`
3. Preview from the **landing** step (opening checkout alone has no cart)

The store needs a default payment flow or checkout will spin. This is a beta — pixels and payment methods stay on the target account.

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
/              landing — region chips (🇺🇸 / 🇪🇺 / 🌍) + Buy now (tee $29.99)
/checkout      pay
/offer         ONE route, three offers — picked by the simulated region
/thank-you     main order + relatedOrders if you accepted
```

The region chips stand in for real geo detection so you can walk all three
branches from one browser. On a hosted funnel the same split is three edges
out of the checkout step:

- `customer.fromCountry { country: "US" }` → cap
- `customer.fromEU` → beanie
- `always` (lower priority) → tote

`scripts/seed.ts` creates the four products, the three offers, and a free shipping rate, then writes the ids into `.env`.

---

## Tutorial

- Start here: [Geo-based offers](https://docs.tagada.io/developer-tools/funnel-demos/geo-offers)
- Catalog of types: [Funnel demos](https://docs.tagada.io/developer-tools/funnel-demos/introduction)
- Headless APIs used: [`createSessionUrl`](https://docs.tagada.io/developer-tools/headless-sdk/checkout-flow), [`processOfferPayment`](https://docs.tagada.io/developer-tools/headless-sdk/offers), [`useOrder`](https://docs.tagada.io/developer-tools/headless-sdk/customer)

License: MIT — fork freely.
