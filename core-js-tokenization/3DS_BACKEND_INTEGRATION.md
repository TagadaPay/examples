# 3DS Backend Integration - Complete Implementation

## ✅ What Was Fixed

### Problem

The 3DS session was being created with BasisTheory locally, but **NOT** being persisted to the backend database. This caused:

- ❌ No database record of 3DS sessions
- ❌ Cannot track 3DS authentication attempts
- ❌ Cannot use session in payment processing
- ❌ No audit trail for compliance

### Solution

Implemented complete backend integration with proper security and API client pattern.

## 🏗️ Architecture

### Flow Overview

```
Client (Example App)
  ↓ useThreeds({ apiClient })
  ↓
Core-JS ThreedsManager
  ↓ createSession()
  ↓
1. Create session with BasisTheory (local)
  ↓
2. Persist to backend via API client
  ↓ POST /api/public/v1/threeds/create-session
  ↓
Public API Router
  ↓
createSessionPublicApi (hasRoleProcedure['org:admin'])
  ↓
Security Validations:
  ✅ Store ownership
  ✅ Payment instrument ownership
  ✅ Account scoping
  ↓
getAuthenticatorByProvider('basis_theory')
  ↓
Save to database (threedsSessions table)
  ↓
Return persisted session with database ID
```

## 📁 Files Modified

### 1. **Backend Action** (`src/app/actions/threedsecure.action.ts`)

**Added:**

- `createSessionPublicApi` - New public API version with `hasRoleProcedure(['org:admin'])`
- Complete security validations
- Proper error handling with ZSAError

**Security Checks:**

```typescript
// 1. Validate store ownership
const store = await db.query.stores.findFirst({
  where: eq(stores.id, storeId),
});

if (store.accountId !== account.id) {
  throw new ZSAError('FORBIDDEN', 'You do not have permission to access this store');
}

// 2. Validate payment instrument ownership
const paymentInstrument = await db.query.paymentInstruments.findFirst({
  where: eq(paymentInstruments.id, paymentInstrumentId),
});

if (paymentInstrument.accountId !== account.id) {
  throw new ZSAError('FORBIDDEN', 'You do not have permission to use this payment instrument');
}
```

**Updated:**

- `createSession` (CMS version) - Added security validations for backward compatibility

### 2. **Public API Router** (`src/app/api/public/v1/[[...openapi]]/router.tsx`)

**Added:**

```typescript
.post('/threeds/create-session', createSessionPublicApi, {
  tags: ['3ds'],
  summary: 'Create 3DS session',
  description: `...`,
  examples: { /* comprehensive examples */ }
})
```

**Documentation Includes:**

- Security & permissions requirements
- Workflow steps
- Benefits of pre-creating session
- Example requests and responses
- Error scenarios

### 3. **API Client** (`examples/github-examples/core-js-tokenization/src/utils/apiClient.ts`)

**Created:**

```typescript
export function createThreedsApiClient(
  apiBaseUrl: string,
  getAuthToken: () => string,
  getStoreId: () => string,
): IThreedsApiClient;
```

**Features:**

- Implements `IThreedsApiClient` interface
- Creates sessions through public API
- Automatically adds storeId from context
- Proper error handling
- Authorization header support

### 4. **Example App** (`examples/github-examples/core-js-tokenization/src/App.tsx`)

**Added:**

```typescript
// Create API client with context
const apiClient = useMemo(() => {
  return createThreedsApiClient(
    apiBaseUrl,
    () => apiToken.trim(),
    () => storeId.trim(),
  );
}, [apiBaseUrl, apiToken, storeId]);

// Pass to useThreeds
const { createSession } = useThreeds({
  environment: 'production',
  apiClient, // ✅ Backend integration enabled!
  autoInitialize: true,
});
```

### 5. **Core-JS ThreedsManager** (`packages/core-js/src/threeds/ThreedsManager.ts`)

**Enhanced Logging:**

```typescript
// If API client is available, persist session to backend
if (this.apiClient) {
  const persistedSession = await this.apiClient.createSession({
    provider: providerName,
    sessionData: session.metadata?.raw || session,
    paymentInstrumentId: paymentInstrument.id,
  });

  console.log('✅ 3DS session persisted to backend:', persistedSession.id);

  return {
    ...session,
    id: persistedSession.id, // Database ID
    externalSessionId: session.sessionId, // BasisTheory session ID
  };
}
```

## 🔒 Security Model

### Authorization Chain

**Level 1: API Authentication**

- Requires valid Bearer token
- Token must have `org:admin` role

**Level 2: Store Ownership**

```typescript
if (store.accountId !== account.id) {
  throw new ZSAError('FORBIDDEN', '...');
}
```

**Level 3: Payment Instrument Ownership**

```typescript
if (paymentInstrument.accountId !== account.id) {
  throw new ZSAError('FORBIDDEN', '...');
}
```

**Result:** Users can ONLY create 3DS sessions for payment instruments they own, in stores they own.

## 📡 API Endpoint

### POST `/api/public/v1/threeds/create-session`

**Request:**

```json
{
  "provider": "basis_theory",
  "storeId": "store_eaa20d619f6b",
  "paymentInstrumentId": "inst_abc123",
  "sessionData": {
    "id": "15f8d1f9-1c27-4573-afd7-953ced14d8d2",
    "type": "customer",
    "cardBrand": "Visa",
    "directory_server_id": "A000000003",
    "recommended_version": "2.2.0"
  }
}
```

**Response:**

```json
{
  "id": "threeds_xyz789", // ✅ Database ID
  "externalSessionId": "15f8d1f9...", // BasisTheory session ID
  "provider": "basis_theory",
  "status": "created",
  "paymentInstrumentId": "inst_abc123",
  "createdAt": "2024-03-20T10:30:00Z"
}
```

## 🎯 Complete User Flow

```
1. User tokenizes card
   ↓
2. User creates payment instrument
   ↓ (API: POST /payment-instruments/create-from-token)
   ↓ Returns: { paymentInstrument: { id: "inst_xxx" } }
   ↓
3. User clicks "Create 3DS Session"
   ↓ useThreeds.createSession()
   ↓
   a) ThreedsManager creates BasisTheory session locally
   ↓ sessionData = { id: "15f8d...", cardBrand: "Visa", ... }
   ↓
   b) apiClient.createSession() called
   ↓ POST /api/public/v1/threeds/create-session
   ↓ Body: { provider, sessionData, paymentInstrumentId, storeId }
   ↓
   c) Backend validates and persists
   ↓ Validates: store ownership, PI ownership, account scoping
   ↓ Calls: authenticator.createSession()
   ↓ Saves to: threedsSessions table
   ↓
   d) Returns database session
   ↓ { id: "threeds_xyz", externalSessionId: "15f8d...", ... }
   ↓
4. User processes payment
   ↓ POST /payments/process
   ↓ Body: { ..., threedsSessionId: "threeds_xyz" }
   ↓
5. Payment flow uses persisted 3DS session
   ↓ Queries: db.query.threedsSessions.findFirst()
   ↓ Uses for: 3DS authentication
   ↓ Updates: session status on completion
```

## 🔍 Debugging

### Console Logs to Watch

**Success Case:**

```
1. BasisTheory3ds initialized successfully
2. 3DS Session created: { id: "15f8d...", ... }
3. ✅ 3DS session persisted to backend: threeds_xyz789
4. Payment processed with threedsSessionId: threeds_xyz789
```

**Failure Cases:**

```
❌ Failed to persist session to backend: [error]
  → Check API token has org:admin role
  → Check store ownership
  → Check payment instrument ownership

Store ID is required to create 3DS session
  → Verify storeId is set before creating session

Payment instrument not found
  → Verify payment instrument was created successfully
```

## 🎨 UI Indicators

### Before Backend Integration

```
🔐 Create 3DS Session (Optional - Recommended for security)
  ↓ Click
Creating 3DS Session...
  ↓
✅ 3DS Session Created! (local only)
Session ID: 15f8d1f9-1c27-4573-afd7-953ced14d8d2
```

### After Backend Integration

```
🔐 Create 3DS Session (Optional - Recommended for security)
  ↓ Click
Creating 3DS Session...
  ↓
✅ 3DS Session Created! Payment will use this session for enhanced security.
Session ID: threeds_xyz789 ← Database ID (not BasisTheory ID)
  ↓
✅ 3DS Session Ready: Payment will use pre-created session
```

## ✅ Security Validations

| Check                        | CMS Version        | Public API Version |
| ---------------------------- | ------------------ | ------------------ |
| Store ownership              | ❌                 | ✅                 |
| Payment instrument ownership | ✅ (customer only) | ✅ (account)       |
| Account scoping              | ✅                 | ✅                 |
| Role-based access            | CMS auth           | org:admin          |
| Error handling               | Basic throw        | ZSAError           |

## 🚀 Benefits

**Before:**

- ❌ Sessions not persisted
- ❌ No audit trail
- ❌ Cannot track in dashboard
- ❌ Cannot use in payment flow

**After:**

- ✅ Sessions persisted to database
- ✅ Complete audit trail
- ✅ Trackable in dashboard
- ✅ Usable in payment processing
- ✅ Compliance-ready
- ✅ Proper security validations

## 📝 Testing

### Test the Complete Flow

1. **Create Payment Instrument**

```bash
curl -X POST https://app.tagadapay.com/api/public/v1/payment-instruments/create-from-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tagadaToken": "eyJ0eXB...",
    "storeId": "store_eaa20d619f6b",
    "customerData": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    }
  }'
```

2. **Create 3DS Session**

```bash
curl -X POST https://app.tagadapay.com/api/public/v1/threeds/create-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "basis_theory",
    "storeId": "store_eaa20d619f6b",
    "paymentInstrumentId": "inst_abc123",
    "sessionData": {
      "id": "15f8d1f9-1c27-4573-afd7-953ced14d8d2",
      "type": "customer",
      "cardBrand": "Visa"
    }
  }'
```

3. **Process Payment**

```bash
curl -X POST https://app.tagadapay.com/api/public/v1/payments/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2999,
    "currency": "USD",
    "storeId": "store_eaa20d619f6b",
    "paymentInstrumentId": "inst_abc123",
    "threedsSessionId": "threeds_xyz789"
  }'
```

## 🎉 Result

The example app now has **complete end-to-end 3DS integration** with proper backend persistence and security validations!

All sessions are tracked in the `threedsSessions` table and can be used throughout the payment lifecycle.
