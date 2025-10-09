# 3DS Authentication Demo

This example demonstrates the complete payment flow with 3DS (Three Domain Secure) authentication using `@tagadapay/core-js`.

## Features

✅ **Step 1**: Card tokenization with BasisTheory  
✅ **Step 2**: Create payment instrument via API  
✅ **Step 3**: Process payment  
✅ **Step 4**: Handle 3DS authentication automatically

## Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your BasisTheory public API key:

```env
VITE_BASIS_THEORY_PUBLIC_KEY=your_basis_theory_public_key_here
```

**Where to get the key:**

- Go to [BasisTheory Portal](https://portal.basistheory.com)
- Create an account or login
- Navigate to API Keys
- Create a new **Public** API key
- Copy and paste it into your `.env` file

### 3. Run the Demo

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

## How It Works

### Architecture

The demo uses the new modular 3DS implementation from `@tagadapay/core-js`:

```typescript
import { useThreeds } from '@tagadapay/core-js/react';

// Initialize 3DS hook
const { startChallenge, isLoading, error } = useThreeds({
  providers: {
    basis_theory: {
      apiKey: import.meta.env.VITE_BASIS_THEORY_PUBLIC_KEY || '',
    },
  },
  autoInitialize: true,
});
```

### Payment Flow

1. **Tokenize Card** (Client-Side)

   - User enters card details
   - Card is tokenized via BasisTheory
   - TagadaToken is generated

2. **Create Payment Instrument** (API Call)

   ```typescript
   POST /api/public/v1/payment-instruments/create-from-token
   {
     "tagadaToken": "...",
     "storeId": "store_eaa20d619f6b",
     "customerData": {
       "email": "customer@example.com",
       "firstName": "John",
       "lastName": "Doe"
     }
   }
   ```

3. **Process Payment** (API Call)

   ```typescript
   POST /api/public/v1/payments/process
   {
     "amount": 2999,
     "currency": "USD",
     "storeId": "store_xxx",
     "paymentInstrumentId": "pi_xxx"
   }
   ```

4. **Handle 3DS Challenge** (If Required)

   ```typescript
   // Check if 3DS is required
   if (paymentResult.requireAction === 'threeds_auth') {
     // Start challenge (modal appears automatically)
     await startChallenge({
       sessionId: threedsSession.externalSessionId,
       acsChallengeUrl: threedsSession.acsChallengeUrl,
       acsTransactionId: threedsSession.acsTransID,
       threeDSVersion: threedsSession.messageVersion,
     });

     // Poll for payment status after 3DS completion
     const finalResult = await pollPaymentStatus(paymentId);
   }
   ```

### Key Code Sections

#### 1. Initialize 3DS Hook

```typescript
const {
  createSession, // Create 3DS session
  startChallenge, // Start 3DS challenge
  isLoading: isThreeDsLoading,
  error: threeDsError,
} = useThreeds({
  providers: {
    basis_theory: {
      apiKey: import.meta.env.VITE_BASIS_THEORY_PUBLIC_KEY || '',
    },
  },
  autoInitialize: true,
});
```

#### 2. Create 3DS Session (Before Payment)

```typescript
const create3dsSession = async () => {
  if (!paymentInstrumentResult) return;

  try {
    // Create 3DS session using core-js hook
    const session = await createSession(
      {
        id: paymentInstrumentResult.paymentInstrument.id,
        token: tokenResult?.decodedTagadaToken.token || null,
        type: paymentInstrumentResult.paymentInstrument.type,
        card: {
          expirationMonth: paymentInstrumentResult.paymentInstrument.card.expMonth,
          expirationYear: paymentInstrumentResult.paymentInstrument.card.expYear,
          last4: paymentInstrumentResult.paymentInstrument.card.last4,
        },
      },
      {
        amount: paymentAmount,
        currency: 'USD',
        customerInfo: {
          name: `${paymentInstrumentResult.customer.firstName} ${paymentInstrumentResult.customer.lastName}`,
          email: paymentInstrumentResult.customer.email,
        },
      },
    );

    setThreedsSessionId(session.id);
    console.log('3DS Session created:', session);
  } catch (error) {
    console.error('Error creating 3DS session:', error);
  }
};
```

#### 3. Process Payment with 3DS Session

```typescript
const processPayment = async () => {
  const response = await fetch('/api/public/v1/payments/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      amount: paymentAmount,
      currency: 'USD',
      storeId: storeId,
      paymentInstrumentId: paymentInstrumentResult.paymentInstrument.id,
      threedsSessionId: threedsSessionId || undefined, // Use pre-created session
    }),
  });

  const result = await response.json();

  // If 3DS challenge is required, handle it
  if (result.payment.requireAction === 'threeds_auth') {
    await handle3DSChallenge(result);
  }
};
```

#### 4. Handle 3DS Challenge (If Required)

```typescript
const handle3DSChallenge = async (paymentResult: PaymentResult) => {
  if (!paymentResult.payment.requireActionData?.metadata?.threedsSession) {
    throw new Error('Missing 3DS session data');
  }

  const { threedsSession } = paymentResult.payment.requireActionData.metadata;

  setThreeDsStatus('in_progress');

  try {
    // Start 3DS challenge (modal handled automatically)
    await startChallenge({
      sessionId: threedsSession.externalSessionId,
      acsChallengeUrl: threedsSession.acsChallengeUrl,
      acsTransactionId: threedsSession.acsTransID,
      threeDSVersion: threedsSession.messageVersion,
    });

    setThreeDsStatus('completed');

    // Poll for payment status after 3DS completion
    const finalResult = await pollPaymentStatus(paymentResult.payment.id);
    setPaymentResult(finalResult);
  } catch (error) {
    setThreeDsStatus('failed');
    throw error;
  }
};
```

#### 5. Retry Failed Payments

```typescript
const retryPayment = async () => {
  // Clear previous results but keep payment instrument and 3DS session
  setPaymentResult(null);
  setApiError(null);
  setRetryCount((prev) => prev + 1);

  // Process payment with same parameters (including existing 3DS session)
  await processPayment();
};
```

#### 6. Poll Payment Status After 3DS

```typescript
const pollPaymentStatus = async (paymentId: string, maxAttempts = 20) => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${apiToken.trim()}`,
      },
    });

    const result: PaymentResult = await response.json();

    // Check if payment is complete
    if (result.payment.status === 'succeeded' || result.payment.status === 'failed') {
      return result;
    }

    // Wait before next poll (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('Payment verification timeout');
};
```

## UI Features

### 4-Step Progress Indicator

The demo includes a visual progress indicator showing:

1. ✅ **Tokenize** - Card tokenization
2. ✅ **Create PI** - Payment instrument creation
3. ✅ **Payment** - Payment processing
4. ✅ **3DS Auth** - 3DS authentication (if required)

### 3DS Status Display

Real-time status updates:

- `idle` - No 3DS required
- `required` - 3DS authentication needed
- `in_progress` - Challenge in progress
- `completed` - Authentication successful
- `failed` - Authentication failed

### Automatic Modal

The 3DS challenge modal:

- Appears automatically when 3DS is required
- Responsive (mobile and desktop)
- User-friendly interface
- Secure iframe integration
- Auto-closes on success/failure

## Testing

### Test Cards

Use BasisTheory test cards:

**3DS Required:**

```
Card Number: 4000 0000 0000 3220
Expiry: Any future date
CVC: Any 3 digits
```

**3DS Not Required:**

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### Test Store ID and API Token

You'll need:

**1. Store ID:**

- Get from TagadaPay dashboard → Stores
- Format: `store_xxx`
- Example: `store_eaa20d619f6b`

**2. API Token with `org:admin` permissions:**

- Login to TagadaPay dashboard
- Go to Settings → API Keys
- Create a new API key
- Copy and use in the demo
- The authenticated account must own the store

## Troubleshooting

### Modal doesn't appear

**Solution:** Check that your BasisTheory API key is correct in `.env`

### Payment fails after 3DS

**Solution:** Verify your payment flow is configured correctly in TagadaPay dashboard

### Store not found or unauthorized

**Solution:**

- Verify the Store ID is correct
- Ensure your API token's account owns the store
- Check that the store exists and is active

### 3DS timeout

**Solution:** Increase the polling max attempts or interval

## Benefits of This Implementation

### 1. Modular Architecture

- 3DS logic separated into core-js
- Easy to maintain and update
- Reusable across projects

### 2. Type-Safe

- Full TypeScript support
- Autocomplete for all APIs
- Compile-time error checking

### 3. Error Handling

- Comprehensive error messages
- Specific error codes
- User-friendly feedback

### 4. User Experience

- Automatic modal management
- Clear progress indicators
- Real-time status updates
- Responsive design

## Learn More

- [3DS Implementation Guide](../../packages/core-js/src/threeds/README.md)
- [Migration Guide](../../packages/core-js/MIGRATION_GUIDE.md)
- [Usage Examples](../../templates/generic/THREEDS_USAGE_EXAMPLES.md)
- [TagadaPay Documentation](https://docs.tagadapay.com)

## Support

For issues or questions:

- GitHub Issues: https://github.com/tagadapay/tagadapay/issues
- Email: support@tagadapay.com
- Documentation: https://docs.tagadapay.com
