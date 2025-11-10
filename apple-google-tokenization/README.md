# Apple Pay & Google Pay Tokenization Example

This example demonstrates how to use `@tagadapay/core-js` for Apple Pay and Google Pay tokenization with **real TagadaPay API integration**.

## Features

- **Apple Pay**: Tokenization using `@tagadapay/core-js`
- **Google Pay**: Tokenization using `@tagadapay/core-js`
  - Provider-agnostic tokenization via BasisTheory
  - TagadaToken generation (standardized format)
  - Consistent API with other payment methods
- **Real Payment Instrument Creation**: Actual API calls to TagadaPay (not mocked)
- **Step-by-Step Flow**: Clear UI progression from tokenization to payment instrument
- **Well-Organized Code**: Modular components, custom hooks, and utility functions

## Setup

1. **Build the core-js package first:**
   ```bash
   cd ../../tagadapay-app/packages/core-js
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API credentials:**
   - Get your TagadaPay API token from the dashboard
   - Enter your Store ID and API token in the app's Server Configuration section

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## What's New - Google Pay with Core-JS

### Before (Manual BasisTheory Integration)
```typescript
// Direct API calls to BasisTheory
const response = await fetch('https://api.basistheory.com/google-pay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'BT-API-KEY': apiKey,
  },
  body: JSON.stringify({ google_payment_data: token }),
});
```

### After (Using @tagadapay/core-js)
```typescript
import { useCardTokenization } from '@tagadapay/core-js/react';

const { tokenizeGooglePay } = useCardTokenization({ 
  environment: 'development' 
});

// Extract Google Pay token
const googlePayToken = JSON.parse(paymentData.paymentMethodData.tokenizationData.token);

// Tokenize with core-js
const { tagadaToken, rawToken } = await tokenizeGooglePay(googlePayToken);

// tagadaToken is ready to send to your backend!
```

## Key Benefits

1. **✅ Unified API**: Google Pay now works exactly like Card and Apple Pay
2. **✅ TagadaToken Standard**: Consistent token format across all payment methods
3. **✅ Provider Agnostic**: Easy to switch providers in the future
4. **✅ Type Safety**: Full TypeScript support
5. **✅ Error Handling**: Consistent error handling and loading states

## Test Results

When you test Google Pay, you'll see:

1. **TagadaToken**: Base64-encoded standardized token (ready for backend)
2. **Raw Token**: Normalized response from core-js (for debugging)
3. **Payment Data**: Full Google Pay response (for reference)

## Configuration

The example uses:
- **Environment**: `development` (test mode)
- **Provider**: BasisTheory (via core-js)
- **Merchant ID**: Test merchant ID for Google Pay

## Next Steps

To use this in production:

1. Update `environment` to `'production'`
2. Configure your real Google Pay merchant ID
3. Set up your backend to handle TagadaTokens
4. Deploy and test with real payment methods

## Architecture

```
GooglePayButton (React Component)
    ↓
useCardTokenization (React Hook)
    ↓
Tokenizer (Core Class)
    ↓
BasisTheoryProvider (Provider Implementation)
    ↓
BasisTheory API (External Service)
    ↓
TagadaToken (Standardized Output)
```

This demonstrates the full power of the `@tagadapay/core-js` SDK! 🎉
