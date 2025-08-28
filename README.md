# TagadaPay Complete Payment Demo

A complete demonstration of the TagadaPay payment flow using `@tagadapay/core-js` SDK.

## Features

This demo showcases a complete 3-step payment integration:

### Step 1: Card Tokenization 🎯

- Secure card tokenization using BasisTheory
- Real-time form validation and 3D card preview
- Creates a base64-encoded TagadaToken containing:
  - Card token from BasisTheory
  - Non-sensitive metadata (last4, brand, expiry, etc.)
  - Provider information

### Step 2: Payment Instrument Creation 🚀

- Sends TagadaToken to TagadaPay API
- Creates payment instrument and customer records
- Demonstrates proper API authentication
- Shows complete payment instrument details

### Step 3: Payment Processing 💳

- Processes a demo payment using the created payment instrument
- Configurable payment amount and store ID
- Real-time payment status and transaction details
- Complete end-to-end payment flow demonstration

## Usage

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## API Integration

The demo uses these TagadaPay public API endpoints:

```
POST /api/public/v1/payment-instruments/create-from-token
POST /api/public/v1/payments/process
```

### Requirements

- **API Token**: org:admin role required
- **Base URL**: Default is `https://app.tagadapay.com`
- **TagadaToken**: Base64-encoded token from Step 1

### Example Requests

**Step 2: Create Payment Instrument**

```javascript
const response = await fetch(`${apiBaseUrl}/api/public/v1/payment-instruments/create-from-token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  },
  body: JSON.stringify({
    tagadaToken: 'eyJ0eXBlIjoiY2FyZC...',
    customerData: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
    },
  }),
});
```

**Step 3: Process Payment**

```javascript
const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  },
  body: JSON.stringify({
    amount: 2999, // $29.99 in cents
    currency: 'USD',
    storeId: 'store_eaa20d619f6b',
    paymentInstrumentId: 'pi_123',
  }),
});
```

## Test Cards

Use these test card numbers for development:

| Card Type  | Number              | CVC  | Expiry          |
| ---------- | ------------------- | ---- | --------------- |
| Visa       | 4111 1111 1111 1111 | 123  | Any future date |
| Mastercard | 5555 5555 5555 4444 | 123  | Any future date |
| Amex       | 3782 822463 10005   | 1234 | Any future date |

## Security Features

- ✅ **Secure Tokenization**: No sensitive card data stored
- ✅ **API Authentication**: Bearer token required
- ✅ **Account Isolation**: Operations scoped to authenticated account
- ✅ **Input Validation**: Comprehensive client and server-side validation
- ✅ **Error Handling**: Clear error messages and loading states

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   BasisTheory    │    │   TagadaPay     │
│   (React)       │    │   (Tokenization) │    │   (API)         │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ 1. Card Form    │───▶│ Secure Token     │    │                 │
│ 2. TagadaToken  │◀───│ + Metadata       │    │                 │
│ 3. Create PI    │────────────────────────────▶│ Payment         │
│ 4. Process Pay  │────────────────────────────▶│ Instrument      │
│ 5. Success UI   │◀────────────────────────────│ + Payment       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Built With

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@tagadapay/core-js** - Payment SDK
- **BasisTheory** - Secure tokenization
