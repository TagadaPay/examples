# Apple Pay & Google Pay Integration Demo

> 📘 **Step-by-step tutorial:** [Apple Pay & Google Pay](https://docs.tagada.io/developer-tools/examples/apple-google-pay)

Complete demonstration of `@tagadapay/core-js` v2.0.0 with Apple Pay, Google Pay, and traditional card tokenization, including payment instrument creation, 3DS authentication, and payment processing.

## Features

- 🍎 **Apple Pay Integration** - Native Apple Pay button with secure payment processing
- 🟢 **Google Pay Integration** - Google Pay API integration with tokenization

## Quick Start

```bash
# Install dependencies
pnpm install

# Run demo
pnpm run dev
```

Open http://localhost:5173

## Apple Pay HTTPS Testing Setup

**⚠️ Important**: Apple Pay requires HTTPS to function. For local development, use ngrok to create a secure tunnel:

### 1. Install ngrok
```bash
# Install ngrok (if not already installed)
npm install -g ngrok
# or
brew install ngrok
```

### 2. Start your development server
```bash
pnpm run dev
# Server runs on http://localhost:5173
```

### 3. Create HTTPS tunnel with ngrok
```bash
# In a new terminal, create secure tunnel
ngrok http 5173
```

### 4. Use the HTTPS URL
```bash
# ngrok will provide URLs like:
# https://abc123.ngrok.io -> http://localhost:5173
```

### 5. Test Apple Pay
- Open the **https://abc123.ngrok.io** URL in Safari
- Apple Pay button will be functional on the secure domain
- Test the complete payment flow


## Configuration Management

This example demonstrates proper configuration management using `@tagadapay/core-js` utilities:

### Environment-Based Configuration

```typescript
import { getGoogleTenantId } from '@tagadapay/core-js/core';

// Automatically uses the correct tenant ID for your environment
const tenantId = getGoogleTenantId('development'); // Test environment
const tenantId = getGoogleTenantId('production');  // Production environment
const tenantId = getGoogleTenantId('local');       // Local development
```

### Benefits of Using Configuration Utilities

- ✅ **Environment Safety**: Prevents accidental production key usage in development
- ✅ **Centralized Config**: Single source of truth for all environments
- ✅ **Type Safety**: Full TypeScript support with IntelliSense
- ✅ **Consistency**: Same configuration pattern across all TagadaPay integrations

## Usage

### 1. Configure Payment Methods

**Digital Wallets Configuration:**
```
Payment Amount: $29.99 (configurable)
Merchant ID: merchant.com.example
Merchant Name: Example Merchant
```

**Server Configuration:**
Get your API keys from: **[https://app.tagadapay.com/settings/apiKeys](https://app.tagadapay.com/settings/apiKeys)**

```
API Base URL: https://app.tagadapay.com
API Token: your_api_token_here
Store ID: store_xxx
```

### 2. Choose Payment Method

**Apple Pay:**
```typescript
const handleApplePayAuthorized = async (paymentData) => {
  // Extract payment token from Apple Pay
  const applePayToken = paymentData.token.paymentData;
  
  // Send to your backend to create TagadaToken
  const tagadaToken = await createTagadaTokenFromApplePay(applePayToken);
  
  // Continue with payment flow
};
```

**Google Pay:**
```typescript
const handleGooglePayAuthorized = async (paymentData) => {
  // Extract payment token from Google Pay
  const googlePayToken = paymentData.paymentMethodData.tokenizationData.token;
  
  // Send to your backend to create TagadaToken
  const tagadaToken = await createTagadaTokenFromGooglePay(googlePayToken);
  
  // Continue with payment flow
};
```

**Google Pay Configuration:**

```typescript
import { getGoogleTenantId } from '@tagadapay/core-js/core';

// Get tenant ID for current environment
const tenantId = getGoogleTenantId('development'); // or 'production', 'local'

// Configure Google Pay payment request
const paymentRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: 'basistheory',
          gatewayMerchantId: tenantId, // Dynamic tenant ID from core-js
        },
      },
    },
  ],
  merchantInfo: {
    merchantId: 'merchant.com.example',
    merchantName: 'Example Merchant',
  },
  transactionInfo: {
    totalPriceStatus: 'FINAL',
    totalPrice: '29.99',
    currencyCode: 'USD',
  },
};

// Use with @google-pay/button-react
<GooglePayButtonReact
  environment="TEST"
  paymentRequest={paymentRequest}
  onPaymentAuthorized={handleGooglePayAuthorized}
/>
```

**Advanced Google Pay Express Checkout:**

For a complete implementation with shipping options, address handling, tax calculation, and dynamic pricing updates, see the comprehensive example:

📁 **`src/components/GooglePayExpressCheckout.tsx`**

This advanced example includes:
- ✅ **Dynamic Shipping Calculation**: Real-time shipping options based on address
- ✅ **Tax Calculation**: Automatic tax computation by state/region
- ✅ **Address Handling**: Full billing and shipping address collection
- ✅ **Order Summary Updates**: Live price updates as user selects options
- ✅ **Shipping Options**: Multiple shipping methods with pricing
- ✅ **Email Collection**: Customer email capture during checkout
- ✅ **Error Handling**: Comprehensive error management for all scenarios
- ✅ **Loading States**: Proper UI feedback during calculations
- ✅ **Mock Services**: Complete shipping and tax calculation examples

```typescript
// Advanced usage with full express checkout features
<GooglePayExpressCheckout
  merchantId="merchant.com.example"
  merchantName="Example Store"
  initialAmount={2999} // $29.99 in cents
  currency="USD"
  onSuccess={(result) => {
    // result includes: tagadaToken, rawToken, paymentData, orderSummary
    console.log('Payment successful:', result);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

**Key Features Demonstrated:**
- **`onPaymentDataChanged`**: Handles shipping address and option changes
- **`callbackIntents`**: Enables dynamic updates during checkout flow
- **`shippingOptionParameters`**: Provides multiple shipping methods
- **`displayItems`**: Shows itemized pricing breakdown
- **Mock Services**: Examples of shipping and tax calculation APIs

### 3. Create Payment Instrument

```typescript
const result = await createPaymentInstrument({
  tagadaToken,
  storeId,
  customerData: { email, firstName, lastName },
});
```

### 4. Create 3DS Session (Conditional)

**When to use:**
- ✅ **Required**: If using TagadaPay's 3DS implementation
- ❌ **Skip**: If your processor has native 3DS (example stripe),

```typescript
// Only needed for TagadaPay 3DS implementation
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
├── ApplePayButton          (Apple Pay integration)
├── GooglePayButton         (Google Pay integration)
├── GooglePayExpressCheckout (Advanced Google Pay with shipping/tax)
├── CardForm               (Traditional card input)
├── useCardTokenization    (BasisTheory tokenization)
├── useThreeds             (3DS session creation & challenge)
├── usePaymentFlow         (UI state & flow orchestration)
└── App.tsx                (Demo UI)
```

### Server-Side (Backend)

```
🔴 BACKEND (src/api/paymentBackend.ts)
├── createPaymentInstrument()   Plain Node.js functions
├── persistThreedsSession()     (easy to move to your server)
├── processPayment()
└── pollPaymentStatus()
```


### Key Components

**Google Pay Integration:**

```typescript
// Uses dynamic tenant ID configuration
import { getGoogleTenantId } from '@tagadapay/core-js/core';

const GooglePayButton = () => {
  const tenantId = getGoogleTenantId('development');
  
  // Payment request automatically uses correct tenant ID
  const paymentRequest = {
    // ... configuration
    allowedPaymentMethods: [{
      tokenizationSpecification: {
        parameters: {
          gateway: 'basistheory',
          gatewayMerchantId: tenantId, // Environment-specific
        },
      },
    }],
  };
};
```

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
  console.log('3DS authentication required');
}
```

## Troubleshooting

### Apple Pay Issues

**Problem**: Apple Pay button doesn't appear
```bash
# Check:
✅ Using HTTPS domain (not localhost HTTP)
✅ macOS/iOS device with Apple Pay enabled
✅ Valid merchant ID configured
```

**Problem**: "Apple Pay is not available" message
```bash
# Solutions:
1. Verify HTTPS connection (check for 🔒 in address bar)
2. Test on actual Apple device (not simulator for production testing)
3. Ensure Apple Pay is set up in device settings
4. Check browser console for errors
```

**Problem**: Merchant validation fails
```bash
# In development:
- This is expected (demo doesn't implement real merchant validation)
- Check console logs for validation URL
- In production: 
  1. Verify domain in TagadaPay dashboard
  2. Implement server-side merchant validation endpoint
```

### Google Pay Issues

**Problem**: Google Pay button doesn't appear
```bash
# Check:
✅ Chrome browser recommended
✅ Google account signed in
✅ Internet connection for API loading
✅ Check browser console for JavaScript errors
```

**Problem**: "Google Pay is not available" message
```bash
# Solutions:
1. Ensure Google Pay API script loads successfully
2. Check network connectivity
3. Verify merchant configuration
4. Test with different Google account
```

### General Debugging

**Enable verbose logging:**
```typescript
// Add to browser console for detailed logs
localStorage.setItem('tagada-debug', 'true');
// Reload page to see detailed payment flow logs
```

**Check network requests:**
```bash
# Open browser DevTools > Network tab
# Look for:
✅ Google Pay API script loading
✅ TagadaPay API calls
❌ CORS errors (should not occur with proper setup)
❌ 404 errors on payment endpoints
```

## File Structure

```
src/
├── components/
│   ├── ApplePayButton.tsx     # Apple Pay integration
│   ├── GooglePayButton.tsx    # Google Pay with dynamic tenant ID
│   └── ServerConfig.tsx       # API configuration UI
├── hooks/
│   └── usePaymentFlow.ts     # Payment orchestration
├── api/
│   └── paymentBackend.ts     # Backend API calls (demo)
├── utils/
│   └── localStorage.ts       # History persistence
└── App.tsx                   # Main demo UI
```

## What's New in This Version

- 🆕 **Dynamic Tenant ID**: Google Pay now uses `getGoogleTenantId()` for environment-specific configuration
- 🆕 **Improved Configuration**: Centralized tenant ID management through `@tagadapay/core-js`
- 🆕 **Environment Safety**: Automatic selection of correct tenant ID based on environment
- 🆕 **Better Developer Experience**: No more hardcoded tenant IDs in your code