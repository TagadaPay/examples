# Headless React Checkout

A complete checkout experience built with **`@tagadapay/headless-sdk/react`** — the React hooks layer for TagadaPay's headless checkout, payment, analytics, and post-purchase APIs.

## What This Demonstrates

| Step | Hooks Used | Features |
|------|-----------|----------|
| **Product** | `useCheckout`, `useAnalytics` | Product display, `trackViewContent` |
| **Checkout** | `useCheckout`, `useAnalytics` | Session load, cart management, promo codes, shipping rates, customer/address updates |
| **Payment** | `usePayment`, `useCheckout`, `useAnalytics` | Payment setup, card tokenization, payment processing, 3DS |
| **Confirmation** | `useAnalytics`, `useOffers` | Purchase tracking, post-purchase upsells |

## Quick Start

```bash
cd headless-react
pnpm install
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173) and configure:

1. **Store ID** — your TagadaPay store identifier
2. **Checkout Token** — from the TagadaPay API or dashboard

## Architecture

```
src/
├── App.tsx                         # Root with TagadaHeadlessProvider
├── components/
│   ├── ConfigPanel.tsx             # Store + environment config
│   ├── StepIndicator.tsx           # Multi-step progress
│   ├── ProductStep.tsx             # Product display
│   ├── CheckoutStep.tsx            # Session, cart, promo, shipping
│   ├── PaymentStep.tsx             # Card form, tokenize, pay
│   └── ConfirmationStep.tsx        # Success + upsell offers
```

All hooks are imported from `@tagadapay/headless-sdk/react`:

```tsx
import {
  TagadaHeadlessProvider,
  useCheckout,
  usePayment,
  useAnalytics,
  useOffers,
  useCustomer,
} from '@tagadapay/headless-sdk/react';
```

## Key Patterns

### Provider Setup

```tsx
<TagadaHeadlessProvider
  storeId="store_abc123"
  environment="production"
  apiKey="tgd_pk_..."
>
  <App />
</TagadaHeadlessProvider>
```

### Checkout Session

```tsx
const { session, updateCustomer, applyPromo } = useCheckout(checkoutToken);
```

### Payment Flow

```tsx
const { tokenizeCard, pay, isProcessing } = usePayment();

const { tagadaToken } = await tokenizeCard({ cardNumber, expiryDate, cvc });
const result = await pay({ checkoutSessionId: session.id, tagadaToken });
```

### Analytics

```tsx
const { trackPurchase } = useAnalytics();
trackPurchase({ orderId: 'ord_xxx', amount: 4900, currency: 'USD' });
```

### Post-Purchase Offers

```tsx
const { offer, acceptOffer, declineOffer } = useOffers();
await acceptOffer({ offerId: offer.id, checkoutSessionId });
```

## Test Card

| Field | Value |
|-------|-------|
| Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |

## Requirements

- Node.js 18+
- TagadaPay store with API access
- `@tagadapay/headless-sdk` ^1.0.0

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- DM Sans + JetBrains Mono fonts

## License

MIT
