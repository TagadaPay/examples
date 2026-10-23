# Card Tokenization & 3DS Demo

> 📘 **Step-by-step tutorial:** [Card tokenization & 3DS](https://docs.tagada.io/developer-tools/examples/card-tokenization)

Complete demonstration of `@tagadapay/core-js` v2.0.0 with card tokenization, payment instrument creation, 3DS authentication, and payment processing.

## Features

- ✅ **Card Tokenization** - Secure client-side tokenization with BasisTheory
- ✅ **TagadaToken** - Automatic creation of TagadaPay's standard token format
- ✅ **Payment Instruments** - Create payment instruments via API
- ✅ **3DS Authentication** - Complete 3DS flow with session creation and challenge handling
- ✅ **SCA Detection** - Automatic detection of Strong Customer Authentication requirements
- ✅ **Payment Processing** - Process payments with optional 3DS
- ✅ **History & Quick-Fill** - LocalStorage for tokens and store IDs
- ✅ **Retry Flow** - Retry failed 3DS from beginning
- ✅ **Client/Server Separation** - Clear architecture ready for production

## Quick Start

```bash
# Install dependencies
pnpm install

# Run demo
pnpm run dev
```

Open http://localhost:5173

## Usage

### 1. Enter Server Config

Get your API keys from: **[https://app.tagadapay.com/settings/apiKeys](https://app.tagadapay.com/settings/apiKeys)**

```
API Base URL: https://app.tagadapay.com
API Token: your_api_token_here
Store ID: store_xxx
```

### 2. Tokenize Card

```typescript
const { tokenizeCard } = useCardTokenization({ apiService, environment: 'production' });

// Get both TagadaToken (for backend) and rawToken (for UI)
const { tagadaToken, rawToken } = await tokenizeCard(cardData);

// Check if 3DS is required (provider-agnostic!)
if (rawToken.metadata?.auth?.scaRequired) {
  console.log('3DS authentication required');
}
```

### 3. Create Payment Instrument

```typescript
const result = await createPaymentInstrument({
  tagadaToken,
  storeId,
  customerData: { email, firstName, lastName },
});
```

### 4. Create 3DS Session (Optional but Recommended)

```typescript
const session = await create3DSSession(paymentInstrument, tokenData, {
  amount: 2999,
  currency: 'USD',
  customerName,
  customerEmail,
  storeId,
});
```

### 5. Process Payment

```typescript
const result = await processPayment({
  amount: 2999,
  currency: 'USD',
  storeId,
  paymentInstrumentId: paymentInstrument.id,
  threedsSessionId: session?.id, // Optional - if created in step 4
});

// If 3DS challenge required, modal appears automatically
// Payment polling happens automatically after challenge
```

## Architecture

### Client-Side (Browser)

```
🟢 CLIENT
├── useCardTokenization     (BasisTheory tokenization)
├── useThreeds              (3DS session creation & challenge)
├── usePaymentFlow          (UI state & flow orchestration)
└── App.tsx                 (Demo UI)
```

### Server-Side (Backend)

```
🔴 BACKEND (src/api/paymentBackend.ts)
├── createPaymentInstrument()   Plain Node.js functions
├── persistThreedsSession()     (easy to move to your server)
├── processPayment()
└── pollPaymentStatus()
```

### Console Output

The demo uses emoji prefixes to show where code executes:

```
🟢 CLIENT: Creating 3DS session with BasisTheory SDK...
✅ BasisTheory session created
🔴 BACKEND: Persisting session to database...
✅ Session persisted: threeds_xyz
🔴 BACKEND: Processing payment...
🟢 CLIENT: Starting 3DS challenge (modal will appear)...
✅ 3DS challenge completed
🔴 BACKEND: Polling payment status...
✅ Payment complete: succeeded
```

## Complete Payment Flow

### Step-by-Step

```
1. User enters card details
   ↓
2. 🟢 CLIENT: Tokenize card with BasisTheory
   ↓ Returns: { tagadaToken, rawToken }
   ↓
3. Check if SCA required
   ↓ if (rawToken.metadata?.auth?.scaRequired)
   ↓
4. 🔴 BACKEND: Create payment instrument
   ↓ POST /api/public/v1/payment-instruments/create-from-token
   ↓ Returns: { paymentInstrument, customer }
   ↓
5. 🟢 CLIENT: Create 3DS session with BasisTheory (optional)
   ↓
6. 🔴 BACKEND: Persist 3DS session to database
   ↓ POST /api/public/v1/threeds/create-session
   ↓ Returns: { id: "threeds_xyz", externalSessionId: "..." }
   ↓
7. 🔴 BACKEND: Process payment
   ↓ POST /api/public/v1/payments/process
   ↓
8a. If 3DS required:
    ↓ 🟢 CLIENT: Display 3DS challenge modal
    ↓ User completes authentication
    ↓ 🔴 BACKEND: Poll payment status
    ↓ Returns: { payment: { status: "succeeded" } }
    ↓
8b. If 3DS not required:
    ↓ Returns: { payment: { status: "succeeded" } }
```

### Key Components

**usePaymentFlow Hook:**

```typescript
const {
  createPaymentInstrument,
  create3DSSession,
  processPayment,
  resetThreeDsStatus,
  isLoading,
  error,
  threeDsStatus,
} = usePaymentFlow({
  backendClient,
  environment: 'production',
});
```

**Backend Client (Demo):**

```typescript
// ⚠️ DEMO ONLY: Calls TagadaPay APIs from browser
const backendClient = new DemoBackendClient(apiBaseUrl, () => apiToken);
```

## SCA/3DS Detection

The SDK automatically detects if a card requires Strong Customer Authentication:

```typescript
const { tagadaToken, rawToken } = await tokenizeCard(cardData);

// ✅ Provider-agnostic check (works with BasisTheory, Stripe, Adyen, etc.)
if (rawToken.metadata?.auth?.scaRequired) {
  // Show SCA warning
  // Create 3DS session
}
```

### UI Indicators

**When SCA Required:**

- 🟠 Orange warning badge
- "Required by Card" button text
- Pre-payment warning message

**When SCA Optional:**

- 🔵 Blue info badge
- "Optional - Recommended" button text
- Informational tip message

## History & Quick-Fill

The demo saves recent tokens and store IDs to localStorage:

- Click **History** button to view saved items
- Click any item to quick-fill the form
- Automatically saves on successful tokenization
- Stores up to 10 recent items per type

**Storage Keys:**

- `tagadapay_token_history` - Token list
- `tagadapay_store_history` - Store list
- `tagadapay_current_store` - Active store

## Retry 3DS from Beginning

When 3DS authentication fails, the "Retry 3DS from Beginning" button:

1. Resets all 3DS state
2. Creates a brand new 3DS session
3. Persists the new session to backend
4. Re-processes the payment with fresh session
5. Displays new 3DS challenge automatically

This gives a complete fresh start with higher success rate.

## Production Migration

### Step 1: Move Backend Functions to Your Server

**Next.js Server Actions:**

```typescript
// app/actions/payment.ts
'use server';

import { createPaymentInstrument, processPayment } from '../api/paymentBackend';
import { auth } from '@/lib/auth';

export async function createPaymentInstrumentAction(params) {
  const session = await auth();
  await validateStoreOwnership(session.user.id, params.storeId);

  // API token stays on server!
  return await createPaymentInstrument(params, process.env.TAGADAPAY_API_KEY!);
}
```

**Express.js Routes:**

```typescript
// routes/payment.ts
import { createPaymentInstrument } from '../api/paymentBackend';
import { authenticate } from '../middleware/auth';

app.post('/api/payment-instruments', authenticate, async (req, res) => {
  await validateStoreOwnership(req.user.id, req.body.storeId);
  const result = await createPaymentInstrument(req.body, process.env.TAGADAPAY_API_KEY!);
  res.json(result);
});
```

### Step 2: Create Production Backend Client

```typescript
// lib/backendClient.ts
class ProductionBackendClient {
  async createPaymentInstrument(params) {
    // ✅ Calls YOUR server (not TagadaPay directly)
    const response = await fetch('/api/payment-instruments', {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include', // Your session/cookies
    });
    return response.json();
  }
  // ... other methods
}

export const backendClient = new ProductionBackendClient();
```

### Step 3: Use in Your App

```typescript
// components/Checkout.tsx
import { usePaymentFlow } from '@/hooks/usePaymentFlow';
import { backendClient } from '@/lib/backendClient';

function Checkout() {
  const { processPayment } = usePaymentFlow({
    backendClient, // ✅ Uses YOUR server
    environment: 'production',
  });
}
```

## File Structure

```
src/
├── api/
│   └── paymentBackend.ts      # 🔴 SERVER: Plain Node.js functions
├── hooks/
│   └── usePaymentFlow.ts      # 🟢 CLIENT: React hook
├── components/
│   ├── CardForm.tsx           # Card tokenization form
│   └── HistorySidebar.tsx     # History UI
├── utils/
│   └── localStorage.ts        # Storage utilities
└── App.tsx                    # Demo UI
```

## Security Checklist

Before production:

- [ ] Move backend functions to your server
- [ ] Never expose `TAGADAPAY_API_KEY` to client
- [ ] Use server-side sessions/cookies for auth
- [ ] Validate user permissions on server
- [ ] Validate store ownership on server
- [ ] Add rate limiting
- [ ] Add logging/monitoring
- [ ] Test error scenarios

## API Endpoints Used

| Endpoint                                               | Method | Purpose                                    |
| ------------------------------------------------------ | ------ | ------------------------------------------ |
| `/api/public/v1/payment-instruments/create-from-token` | POST   | Create payment instrument from TagadaToken |
| `/api/public/v1/threeds/create-session`                | POST   | Persist 3DS session to database            |
| `/api/public/v1/payments/process`                      | POST   | Process payment with optional 3DS          |
| `/api/public/v1/payments/:id`                          | GET    | Poll payment status                        |

## Test Cards

### SCA Required (EU Cards)

```
Card: 5138 6123 4529 2981
Expiry: 09/26
CVC: Any 3 digits
Result: ⚠️ SCA Required
```

### SCA Optional (US Cards)

```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
Result: ✓ SCA Optional
```

## Key Features Demonstrated

### Provider-Agnostic Code

```typescript
// ✅ Works with ANY provider (BasisTheory, Stripe, Adyen)
if (rawToken.metadata?.auth?.scaRequired) {
  // Handle 3DS
}

// ❌ Don't do this (provider-specific)
if (rawToken.card?.authentication === 'sca_required') {
  // Only works with BasisTheory
}
```

### Clean Separation

- **Normalized Fields** - Used for business logic (`metadata.auth.scaRequired`)
- **Raw Provider Data** - Available in `metadata.rawProviderResponse` for advanced use
- **TagadaToken** - SDK creates it automatically

### Complete Error Handling

- Color-coded status (🟢 success, 🔴 error, 🟡 pending)
- Detailed error messages
- Retry mechanisms
- Clear user feedback

## TypeScript

Full type definitions included:

```typescript
import type { CardTokenResponse, TagadaToken, TokenizeCardResult, ThreedsSession } from '@tagadapay/core-js';
```

## Support

- GitHub: [tagadapay/tagadapay](https://github.com/tagadapay/tagadapay)
- Documentation: [docs.tagadapay.com](https://docs.tagadapay.com)
- Issues: [GitHub Issues](https://github.com/tagadapay/tagadapay/issues)

## Summary

This demo shows:

✅ **Complete payment flow** with tokenization, PI creation, 3DS, and payment processing

✅ **Client/server separation** ready for production migration

✅ **Provider-agnostic** architecture (works with any tokenization provider)

✅ **SCA detection** with automatic UI adaptation

✅ **History & quick-fill** for better UX

✅ **Retry mechanisms** for failed 3DS

✅ **Production-ready** patterns and best practices

This is the **reference implementation** for integrating TagadaPay with 3DS authentication! 🚀
