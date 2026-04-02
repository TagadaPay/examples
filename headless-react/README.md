# Headless React Checkout

A complete store simulator demonstrating **@tagadapay/headless-sdk/react** — browse real products, build a cart, and pay.

## Flow

1. **Enter Store ID** — configure your store and environment
2. **Browse Products** — products are fetched via `useCatalog()`
3. **Build a Cart** — add items, adjust quantities
4. **Checkout** — session is auto-created with `createSession()`, then fill customer/shipping info
5. **Pay** — tokenize card and process payment
6. **Confirmation** — success screen with post-purchase offers

## SDK Hooks Used

| Hook | Purpose |
|------|---------|
| `useCatalog()` | Fetch product catalog |
| `useCheckout()` | Create session, update customer/address, shipping rates, promo codes |
| `usePayment()` | Setup payment, tokenize card, process payment |
| `useAnalytics()` | Track page views, add-to-cart, checkout, purchase events |
| `useOffers()` | Load and display post-purchase upsell offers |

## Quick Start

```bash
cd headless-react
pnpm install
pnpm dev
```

Open `http://localhost:5173`, enter a valid Store ID, and start shopping.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- @tagadapay/headless-sdk 1.1.0
