# rx-storefront

Headless Tagada Rx storefront that **creates the same Funnel v2** the hosted templates get on publish.

Landing → marketing quiz → checkout → offer → thank-you (medical intake) → patient portal.

```
https://github.com/TagadaPay/examples/tree/main/rx-storefront
```

Docs: [Tagada Rx with the Headless SDK](https://docs.tagada.io/developer-tools/rx/headless-sdk).

**CRM import (beta):** [`funnel.bundle.json`](./funnel.bundle.json) → Funnels → **Import bundle**. Or run `pnpm seed` — it calls `tagada.funnels.create` with the same graph.

---

## Run it

```bash
cd rx-storefront
npx -p @tagadapay/node-sdk tagada-init you@example.com
pnpm install
pnpm seed
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Then open the new store in the CRM → **Funnels** — you should see the six boxes.

### Test card

```
4242 4242 4242 4242   ·   12/28   ·   123
```

`submitCase` on thank-you needs Tagada Rx **active** on that store and the product mapped to a clinical offering. Without that, checkout still works and the funnel still appears; the intake call returns a clear error.

---

## What you will see

```
/              landing
/quiz          marketing quiz (no medical questions) → starts checkout
/checkout      pay
/offer         optional post-purchase box (skipped in this demo)
/thank-you     medical intake AFTER payment → submitCase → poll
/portal        patient portal (OTP / cases — see portal docs)
```

This is the same path contract as `telehealth-tgdcare` / Cobalt / Arbor.

---

## Tutorial

- [Headless SDK](https://docs.tagada.io/developer-tools/rx/headless-sdk) — bricks + `funnels.create`
- [Building blocks](https://docs.tagada.io/developer-tools/rx/building-blocks)
- [Patient portal](https://docs.tagada.io/developer-tools/rx/patient-portal)

License: MIT — fork freely.
