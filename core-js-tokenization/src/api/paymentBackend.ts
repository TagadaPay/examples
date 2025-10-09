/**
 * Backend API Functions
 * 
 * ⚠️ MOVE TO YOUR SERVER IN PRODUCTION
 * =====================================
 * 
 * These are plain Node.js/TypeScript functions that should run on your backend.
 * They handle sensitive operations that require API tokens and database access.
 * 
 * DO NOT call these from the client in production!
 * Instead, create server-side routes/actions that wrap these functions.
 * 
 * Example frameworks:
 * - Next.js: Create Server Actions or API Routes
 * - Express: Create API endpoints
 * - tRPC: Create procedures
 * - Any Node.js framework
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePaymentInstrumentParams {
    tagadaToken: string;
    storeId: string;
    customerData: {
        email: string;
        firstName: string;
        lastName: string;
    };
}

export interface PersistThreedsSessionParams {
    provider: string;
    storeId: string;
    paymentInstrumentId: string;
    sessionData: Record<string, unknown>;
}

export interface ProcessPaymentParams {
    amount: number;
    currency: string;
    storeId: string;
    paymentInstrumentId: string;
    threedsSessionId?: string;
}

// ============================================================================
// BACKEND FUNCTIONS - Copy these to your server code
// ============================================================================

/**
 * Create payment instrument from TagadaToken
 * 
 * SERVER-SIDE ONLY
 * 
 * @example Next.js Server Action
 * ```typescript
 * 'use server';
 * 
 * export async function createPaymentInstrumentAction(params: CreatePaymentInstrumentParams) {
 *   const session = await auth(); // Your auth
 *   return await createPaymentInstrument(params, process.env.TAGADAPAY_API_KEY!);
 * }
 * ```
 * 
 * @example Express Route
 * ```typescript
 * app.post('/api/payment-instruments', async (req, res) => {
 *   const result = await createPaymentInstrument(
 *     req.body,
 *     process.env.TAGADAPAY_API_KEY
 *   );
 *   res.json(result);
 * });
 * ```
 */
export async function createPaymentInstrument(
    params: CreatePaymentInstrumentParams,
    apiToken: string,
    apiBaseUrl = 'https://app.tagadapay.com',
) {
    const response = await fetch(`${apiBaseUrl}/api/public/v1/payment-instruments/create-from-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create payment instrument: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Persist 3DS session to database
 * 
 * SERVER-SIDE ONLY
 * 
 * @example Next.js Server Action
 * ```typescript
 * 'use server';
 * 
 * export async function persistThreedsSessionAction(params: PersistThreedsSessionParams) {
 *   const session = await auth();
 *   return await persistThreedsSession(params, process.env.TAGADAPAY_API_KEY!);
 * }
 * ```
 */
export async function persistThreedsSession(
    params: PersistThreedsSessionParams,
    apiToken: string,
    apiBaseUrl = 'https://app.tagadapay.com',
) {
    const response = await fetch(`${apiBaseUrl}/api/public/v1/threeds/create-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to persist session: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Process payment
 * 
 * SERVER-SIDE ONLY
 * 
 * @example Next.js Server Action
 * ```typescript
 * 'use server';
 * 
 * export async function processPaymentAction(params: ProcessPaymentParams) {
 *   const session = await auth();
 *   return await processPayment(params, process.env.TAGADAPAY_API_KEY!);
 * }
 * ```
 */
export async function processPayment(
    params: ProcessPaymentParams,
    apiToken: string,
    apiBaseUrl = 'https://app.tagadapay.com',
) {
    const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to process payment: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Poll payment status
 * 
 * SERVER-SIDE ONLY
 * 
 * @example Next.js Server Action
 * ```typescript
 * 'use server';
 * 
 * export async function pollPaymentStatusAction(paymentId: string) {
 *   const session = await auth();
 *   return await pollPaymentStatus(paymentId, process.env.TAGADAPAY_API_KEY!);
 * }
 * ```
 */
export async function pollPaymentStatus(
    paymentId: string,
    apiToken: string,
    apiBaseUrl = 'https://app.tagadapay.com',
    maxAttempts = 20,
) {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payment status');
        }

        const data = await response.json();
        const payment = data.payment || data;

        if (!payment || !payment.status) {
            throw new Error('Invalid payment response');
        }

        // Check if payment is complete
        if (payment.status === 'succeeded' || payment.status === 'failed' || payment.status === 'declined') {
            console.log(`✅ Payment polling complete: ${payment.status}`);
            return { payment };
        }

        console.log(`⏳ Polling attempt ${i + 1}/${maxAttempts}, status: ${payment.status}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Payment verification timeout');
}

// ============================================================================
// DEMO CLIENT (for demonstration only - DO NOT use in production)
// ============================================================================

/**
 * Demo client that calls backend functions directly from the browser
 * 
 * ⚠️ FOR DEMO ONLY - DO NOT USE IN PRODUCTION
 * 
 * In production, replace this with calls to YOUR server endpoints
 */
export class DemoBackendClient {
    private apiBaseUrl: string;
    private getApiToken: () => string;

    constructor(apiBaseUrl: string, getApiToken: () => string) {
        this.apiBaseUrl = apiBaseUrl;
        this.getApiToken = getApiToken;
    }

    async createPaymentInstrument(params: CreatePaymentInstrumentParams) {
        // ⚠️ DEMO: Calling backend function from client
        // ✅ PRODUCTION: Replace with fetch('/api/payment-instruments', ...)
        return createPaymentInstrument(params, this.getApiToken(), this.apiBaseUrl);
    }

    async persistThreedsSession(params: PersistThreedsSessionParams) {
        // ⚠️ DEMO: Calling backend function from client
        // ✅ PRODUCTION: Replace with fetch('/api/threeds/sessions', ...)
        return persistThreedsSession(params, this.getApiToken(), this.apiBaseUrl);
    }

    async processPayment(params: ProcessPaymentParams) {
        // ⚠️ DEMO: Calling backend function from client
        // ✅ PRODUCTION: Replace with fetch('/api/payments', ...)
        return processPayment(params, this.getApiToken(), this.apiBaseUrl);
    }

    async pollPaymentStatus(paymentId: string, maxAttempts = 20) {
        // ⚠️ DEMO: Calling backend function from client
        // ✅ PRODUCTION: Replace with fetch(`/api/payments/${paymentId}`, ...)
        return pollPaymentStatus(paymentId, this.getApiToken(), this.apiBaseUrl, maxAttempts);
    }
}

