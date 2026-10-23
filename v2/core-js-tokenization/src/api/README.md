# Backend API Functions

## ⚠️ IMPORTANT: Move to Server in Production

The functions in `paymentBackend.ts` are **plain Node.js/TypeScript functions** designed to run on your backend.

### What's in This Folder

**`paymentBackend.ts`** - Backend functions that should be moved to your server:

- `createPaymentInstrument()` - Create payment instrument from token
- `persistThreedsSession()` - Save 3DS session to database
- `processPayment()` - Process a payment
- `pollPaymentStatus()` - Poll payment status after 3DS

**`DemoBackendClient`** - Demo wrapper that calls these from the client (⚠️ demo only!)

## Demo vs Production

### In This Demo

```typescript
// ⚠️ DEMO: Calling backend functions from client
const backendClient = new DemoBackendClient(apiBaseUrl, () => apiToken);
const result = await backendClient.createPaymentInstrument(params);
```

**Problems with demo approach:**

- ❌ API tokens exposed to client
- ❌ No server-side validation
- ❌ Security risk
- ❌ Can't use server-only features

### In Production

Move these functions to your server and create endpoints:

#### Option 1: Next.js Server Actions

```typescript
// app/actions/payment.ts
'use server';

import { createPaymentInstrument } from './backend/paymentBackend';

export async function createPaymentInstrumentAction(params) {
  const session = await auth(); // Your auth

  // Validate user permissions
  await validateStoreOwnership(session.userId, params.storeId);

  // Call TagadaPay API from server
  return await createPaymentInstrument(
    params,
    process.env.TAGADAPAY_API_KEY!, // ✅ Secret stays on server
  );
}
```

```typescript
// app/components/CheckoutForm.tsx (Client)
import { createPaymentInstrumentAction } from '../actions/payment';

const result = await createPaymentInstrumentAction(params);
```

#### Option 2: Express.js API Routes

```typescript
// routes/payment.js
import { createPaymentInstrument } from '../api/paymentBackend';

app.post('/api/payment-instruments', async (req, res) => {
  const session = req.session; // Your auth

  const result = await createPaymentInstrument(req.body, process.env.TAGADAPAY_API_KEY);

  res.json(result);
});
```

```typescript
// client/checkout.tsx
const result = await fetch('/api/payment-instruments', {
  method: 'POST',
  body: JSON.stringify(params),
});
```

#### Option 3: tRPC Procedures

```typescript
// server/routers/payment.ts
import { createPaymentInstrument } from '../api/paymentBackend';

export const paymentRouter = router({
  createPaymentInstrument: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ input, ctx }) => {
      return await createPaymentInstrument(
        input,
        process.env.TAGADAPAY_API_KEY!,
      );
    }),
});
```

```typescript
// client/checkout.tsx
const result = await trpc.payment.createPaymentInstrument.mutate(params);
```

## Client-Side Hook

The `usePaymentFlow` hook (in `../hooks/usePaymentFlow.ts`) stays on the client.

It handles:

- ✅ UI state management
- ✅ Client-side SDK calls (BasisTheory)
- ✅ 3DS modal display
- ✅ Flow orchestration

It does NOT handle:

- ❌ Direct API calls to TagadaPay
- ❌ API token storage
- ❌ Database operations

## Migration Steps

### Step 1: Copy Backend Functions to Your Server

```bash
# Copy the plain functions to your backend
cp src/api/paymentBackend.ts backend/api/payment.ts
```

### Step 2: Create Server Endpoints

Choose your framework and create endpoints that wrap these functions.

### Step 3: Update Client to Use Your Endpoints

```typescript
// Replace DemoBackendClient with your production client
class ProductionBackendClient {
  async createPaymentInstrument(params) {
    // ✅ Call YOUR server endpoint
    const response = await fetch('/api/payment-instruments', {
      method: 'POST',
      body: JSON.stringify(params),
      // No Authorization header - handled by your server session/cookies
    });
    return response.json();
  }

  async persistThreedsSession(params) {
    // ✅ Call YOUR server endpoint
    const response = await fetch('/api/threeds/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async processPayment(params) {
    // ✅ Call YOUR server endpoint
    const response = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async pollPaymentStatus(paymentId) {
    // ✅ Call YOUR server endpoint
    const response = await fetch(`/api/payments/${paymentId}`);
    return response.json();
  }
}

// Use in your component
const backendClient = new ProductionBackendClient();
const payment = usePaymentFlow({ backendClient });
```

## Benefits of This Architecture

### Security

- ✅ API tokens never exposed to client
- ✅ Server-side validation and authorization
- ✅ Protection against client-side tampering

### Modularity

- ✅ Easy to swap backend implementations
- ✅ Clear separation of concerns
- ✅ Testable backend functions

### Flexibility

- ✅ Works with any Node.js framework
- ✅ Can add middleware (logging, caching, rate limiting)
- ✅ Easy to extend

## Summary

**📁 `paymentBackend.ts`** - Plain Node.js functions → Move to your server

**🎣 `usePaymentFlow.ts`** - React hook → Stays on client

**🔀 Client ↔️ Server Communication** - Define in your framework of choice

This architecture makes it **super easy** to migrate from demo to production! 🚀
