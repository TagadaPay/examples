# Apple Pay & Google Pay Integration Demo

Complete demonstration of `@tagadapay/core-js` v2.0.0 with Apple Pay, Google Pay, and traditional card tokenization, including payment instrument creation, 3DS authentication, and payment processing.

## Features

- 🍎 **Apple Pay Integration** - Native Apple Pay button with secure payment processing
- 🟢 **Google Pay Integration** - Google Pay API integration with tokenization
- ✅ **Card Tokenization** - Secure client-side tokenization with BasisTheory
- ✅ **TagadaToken** - Automatic creation of TagadaPay's standard token format
- ✅ **Payment Instruments** - Create payment instruments via API
- ✅ **3DS Authentication** - Complete 3DS flow with session creation and challenge handling
- ✅ **SCA Detection** - Automatic detection of Strong Customer Authentication requirements
- ✅ **Payment Processing** - Process payments with optional 3DS
- ✅ **Multiple Payment Methods** - Support for digital wallets and traditional cards
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

### Example ngrok Output
```bash
ngrok by @inconshreveable

Session Status                online
Account                       your-account (Plan: Free)
Version                       2.3.40
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://abc123.ngrok.io -> http://localhost:5173
Forwarding                    https://abc123.ngrok.io -> http://localhost:5173

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Use the HTTPS URL**: `https://abc123.ngrok.io`

### Alternative: Local HTTPS Setup

If you prefer not to use ngrok, you can set up local HTTPS:

```bash
# Install mkcert for local SSL certificates
brew install mkcert
mkcert -install

# Create certificate for localhost
mkcert localhost 127.0.0.1 ::1

# Update vite.config.ts to use HTTPS
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    port: 5173,
  },
})
```

Then access: `https://localhost:5173`

## Payment Methods Supported

### 🍎 Apple Pay
- **Requirements**: 
  - Safari browser on macOS/iOS with Apple Pay enabled
  - **HTTPS domain** (use ngrok for local testing - see setup above)
  - Valid Apple Pay merchant ID
- **Setup**: Configure merchant ID in the merchant configuration section
- **Production**: Requires Apple Developer account and merchant validation

### 🟢 Google Pay
- **Requirements**: Chrome browser with Google Pay enabled
- **Setup**: Configure merchant ID and name in the merchant configuration section
- **Production**: Requires Google Pay merchant account

### 💳 Traditional Cards
- **Note**: Included for comparison with digital wallets
- **Focus**: This example primarily demonstrates Apple Pay and Google Pay

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
- ❌ **Skip**: If your processor has native 3DS (Apple Pay & Google Pay work without it)

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
1. User selects digital wallet payment method (Apple Pay or Google Pay)
   ↓
2. 🟢 CLIENT: Process digital wallet payment
   ↓ Apple Pay: Extract payment data from Apple Pay session
   ↓ Google Pay: Extract token from Google Pay response
   ↓ Returns: Payment token for backend processing
   ↓
3. 🔴 BACKEND: Convert to TagadaToken
   ↓ Process digital wallet token into standardized format
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
  console.log('3DS authentication required');
}
```

## Digital Wallet Benefits

### Apple Pay & Google Pay Advantages

1. **✅ Enhanced Security**: Tokenized payments with biometric authentication
2. **✅ Faster Checkout**: No manual card entry required
3. **✅ Better UX**: Native payment experience users trust
4. **✅ Reduced Fraud**: Built-in fraud protection from Apple/Google
5. **✅ Higher Conversion**: Streamlined payment flow increases completion rates

### Integration Benefits

1. **✅ Unified API**: All payment methods work with the same TagadaPay flow
2. **✅ Consistent Tokens**: Apple Pay, Google Pay, and cards all produce TagadaTokens
3. **✅ Same Backend**: No changes needed to your payment processing backend
4. **✅ Type Safety**: Full TypeScript support across all payment methods
5. **✅ Error Handling**: Consistent error handling and loading states

## Production Checklist

### Apple Pay Setup
- [ ] Apple Developer account configured
- [ ] Merchant ID registered with Apple
- [ ] Domain verification completed
- [ ] Merchant validation endpoint implemented on your server

### Google Pay Setup
- [ ] Google Pay merchant account created
- [ ] Production merchant ID configured
- [ ] Payment processor integration verified
- [ ] Google Pay brand guidelines followed

### TagadaPay Configuration
- [ ] Production API keys obtained
- [ ] Store ID configured
- [ ] Backend endpoints secured
- [ ] 3DS flow tested in production environment

## Test Cards & Scenarios

### Apple Pay Testing
```bash
# Apple Pay Test Environment
- Use Safari on macOS/iOS
- Ensure Apple Pay is set up in System Preferences/Settings
- Use test cards added to Apple Wallet
- Access via HTTPS domain (ngrok tunnel)

# Expected Behavior:
✅ Apple Pay button appears on HTTPS domains
❌ Apple Pay button hidden on HTTP domains
✅ Payment sheet opens when clicked
✅ Touch ID/Face ID authentication works
```

### Google Pay Testing
```bash
# Google Pay Test Environment  
- Use Chrome browser
- Sign in to Google account
- Add test payment methods to Google Pay
- Works on both HTTP and HTTPS

# Expected Behavior:
✅ Google Pay button appears when API loads
✅ Payment sheet opens with saved cards
✅ Test tokenization flow works
```

### Traditional Card Testing
For testing traditional card flows, use these test cards:

```
# Cards requiring 3DS
4000 0027 6000 3184  (Visa - 3DS required)
5555 5557 5555 4444  (Mastercard - 3DS required)

# Cards not requiring 3DS  
4242 4242 4242 4242  (Visa - no 3DS)
5555 5555 5555 4444  (Mastercard - no 3DS)

# Any future expiry date and CVC
```

## Troubleshooting

### Apple Pay Issues

**Problem**: Apple Pay button doesn't appear
```bash
# Check:
✅ Using HTTPS domain (not localhost HTTP)
✅ Safari browser (Chrome won't show Apple Pay)
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
- In production: implement server-side merchant validation endpoint

# Console output should show:
🍎 Apple Pay: Merchant validation required
🔴 BACKEND: In production, validate merchant on your server
Merchant ID: merchant.com.example
Validation URL: https://apple-pay-gateway.apple.com/paymentservices/...
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
│   ├── GooglePayButton.tsx    # Google Pay integration
│   ├── CardForm.tsx          # Traditional card form
│   └── HistorySidebar.tsx    # Token/store history
├── hooks/
│   └── usePaymentFlow.ts     # Payment orchestration
├── api/
│   └── paymentBackend.ts     # Backend API calls (demo)
├── utils/
│   └── localStorage.ts       # History persistence
└── App.tsx                   # Main demo UI
```

This demonstrates the full power of the `@tagadapay/core-js` SDK with multiple payment methods! 🎉
