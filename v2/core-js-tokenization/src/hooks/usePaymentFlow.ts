/**
 * usePaymentFlow Hook (CLIENT-SIDE)
 * 
 * High-level React hook for payment flow with 3DS authentication.
 * This hook stays on the client and handles:
 * - UI state management
 * - Client-side SDK calls (card tokenization, 3DS modal)
 * - Orchestration of payment flow
 * 
 * Backend API calls are abstracted through the backend client.
 * In production, replace backend client with calls to YOUR server.
 */

import { useState, useCallback } from 'react';
import { useThreeds } from '@tagadapay/core-js/react';
import type {
    CreatePaymentInstrumentParams,
    ProcessPaymentParams,
    DemoBackendClient,
} from '../api/paymentBackend';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentInstrument {
    id: string;
    type: string;
    customerId: string;
    accountId: string;
    isActive: boolean;
    isDefault: boolean;
    tokenizer: string;
    createdAt: string;
    card: {
        last4: string;
        brand: string;
        expYear: number;
        expMonth: number;
    };
}

export interface Customer {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    subStatus: string;
    requireAction: 'none' | 'redirect' | 'threeds_auth';
    requireActionData?: {
        type: 'threeds_auth' | 'redirect';
        processed: boolean;
        metadata?: {
            threedsSession?: {
                externalSessionId: string;
                acsChallengeUrl: string;
                acsTransID: string;
                messageVersion: string;
            };
        };
    };
    createdAt: string;
    error?: {
        code?: string;
        message?: string;
        processorCode?: string;
        processorMessage?: string;
    };
}

export interface UsePaymentFlowConfig {
    /** Your backend client instance */
    backendClient: DemoBackendClient;
    /** Environment for BasisTheory SDK */
    environment?: 'production' | 'development' | 'local';
}

export interface UsePaymentFlowReturn {
    // Payment Instrument
    createPaymentInstrument: (params: CreatePaymentInstrumentParams) => Promise<{
        paymentInstrument: PaymentInstrument;
        customer: Customer;
    }>;

    // 3DS Session
    create3DSSession: (
        paymentInstrument: PaymentInstrument,
        tokenData: { token: string; bin?: string },
        options: {
            amount: number;
            currency: string;
            customerName: string;
            customerEmail: string;
            storeId: string;
            skipMethodRequest?: boolean; // Skip device fingerprint collection (faster but may reduce approval rates)
        },
    ) => Promise<{ id: string; externalSessionId: string; provider: string; status: string; paymentInstrumentId: string; createdAt: string }>;

    // Payment
    processPayment: (params: ProcessPaymentParams) => Promise<{ payment: Payment }>;

    // State
    isLoading: boolean;
    error: string | null;
    threeDsStatus: 'idle' | 'required' | 'in_progress' | 'completed' | 'failed';

    // Utilities
    clearError: () => void;
    resetThreeDsStatus: () => void;
}

// ============================================================================
// CLIENT-SIDE REACT HOOK
// ============================================================================

/**
 * usePaymentFlow
 * 
 * CLIENT-SIDE React hook for payment flow.
 * 
 * What this hook does:
 * - Manages UI state (loading, errors, 3DS status)
 * - Calls CLIENT-SIDE SDKs (BasisTheory for tokenization, 3DS)
 * - Displays 3DS modal automatically
 * - Orchestrates the payment flow
 * 
 * What this hook does NOT do:
 * - Store API tokens (passed via backendClient)
 * - Make direct backend API calls (delegated to backendClient)
 * - Handle database operations
 * 
 * @example
 * ```typescript
 * // In your component
 * const backendClient = new DemoBackendClient(apiBaseUrl, () => apiToken);
 * 
 * const {
 *   createPaymentInstrument,
 *   create3DSSession,
 *   processPayment,
 *   isLoading,
 *   error,
 *   threeDsStatus,
 *   resetThreeDsStatus,
 * } = usePaymentFlow({
 *   backendClient,
 *   environment: 'production',
 * });
 * ```
 */
export function usePaymentFlow(config: UsePaymentFlowConfig): UsePaymentFlowReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [threeDsStatus, setThreeDsStatus] = useState<
        'idle' | 'required' | 'in_progress' | 'completed' | 'failed'
    >('idle');

    // ============================================================================
    // CLIENT-SIDE: Initialize 3DS SDK
    // ============================================================================

    const {
        createSession: createLocalSession,
        startChallenge,
        isLoading: isThreeDsLoading,
        error: threeDsError,
    } = useThreeds({
        environment: config.environment || 'production',
        autoInitialize: true,
    });

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Create payment instrument
     * Delegates to backend client
     */
    const createPaymentInstrument = useCallback(
        async (params: CreatePaymentInstrumentParams) => {
            setIsLoading(true);
            setError(null);

            try {
                // Delegate to backend (in production, this calls YOUR server)
                const result = await config.backendClient.createPaymentInstrument(params);
                return result;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to create payment instrument';
                setError(errorMsg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [config.backendClient],
    );

    /**
     * Create 3DS session
     * 
     * CLIENT-SIDE: Creates session with BasisTheory SDK
     * SERVER-SIDE: Persists session to database (via backendClient)
     */
    const create3DSSession = useCallback(
        async (
            paymentInstrument: PaymentInstrument,
            tokenData: { token: string; bin?: string },
            options: {
                amount: number;
                currency: string;
                customerName: string;
                customerEmail: string;
                storeId: string;
                skipMethodRequest?: boolean; // Skip device fingerprint collection (faster but may reduce approval rates)
            },
        ) => {
            setIsLoading(true);
            setError(null);

            try {
                // 🟢 CLIENT-SIDE: Create session with BasisTheory SDK
                console.log('🟢 CLIENT: Creating 3DS session with BasisTheory SDK...');
                const localSession = await createLocalSession(
                    {
                        id: paymentInstrument.id,
                        token: tokenData.token,
                        type: paymentInstrument.type,
                        card: {
                            expirationMonth: paymentInstrument.card.expMonth,
                            expirationYear: paymentInstrument.card.expYear,
                            last4: paymentInstrument.card.last4,
                            bin: tokenData.bin,
                        },
                    },
                    {
                        amount: options.amount,
                        currency: options.currency,
                        customerInfo: {
                            name: options.customerName,
                            email: options.customerEmail,
                        },
                        skipMethodRequest: options.skipMethodRequest, // Pass through to SDK
                    },
                );

                console.log('✅ BasisTheory session created:', localSession.sessionId);

                // 🔴 SERVER-SIDE: Persist session (delegates to backend)
                console.log('🔴 BACKEND: Persisting session to database...');
                const persistedSession = await config.backendClient.persistThreedsSession({
                    provider: localSession.provider,
                    storeId: options.storeId,
                    paymentInstrumentId: paymentInstrument.id,
                    sessionData: localSession.metadata?.raw || localSession,
                });

                console.log('✅ Session persisted:', persistedSession.id);
                return persistedSession;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to create 3DS session';
                setError(errorMsg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [createLocalSession, config.backendClient],
    );

    /**
     * Handle 3DS challenge
     * 
     * CLIENT-SIDE: Displays modal, handles authentication
     * SERVER-SIDE: Polls payment status (via backendClient)
     * 
     * @returns Final payment result after 3DS completion
     */
    const handle3DSChallenge = useCallback(
        async (payment: Payment): Promise<{ payment: Payment } | null> => {
            const actionData = payment.requireActionData;

            if (!actionData?.metadata?.threedsSession) {
                console.log('No 3DS session data found');
                return null;
            }

            const { threedsSession } = actionData.metadata;

            setThreeDsStatus('in_progress');

            try {
                console.log('🟢 CLIENT: Starting 3DS challenge (modal will appear)...');

                // 🟢 CLIENT-SIDE: Display modal and handle authentication
                const challengeCompletion = await startChallenge({
                    sessionId: threedsSession.externalSessionId,
                    acsChallengeUrl: threedsSession.acsChallengeUrl,
                    acsTransactionId: threedsSession.acsTransID,
                    threeDSVersion: threedsSession.messageVersion,
                });

                console.log('✅ 3DS challenge completed');
                console.log('challengeCompletion', challengeCompletion);

                // 🔴 SERVER-SIDE: Poll for payment status
                console.log('🔴 BACKEND: Polling payment status...');
                const finalResult = await config.backendClient.pollPaymentStatus(payment.id);

                console.log('📊 Final payment status:', finalResult.payment.status);

                if (finalResult.payment.status === 'succeeded') {
                    setThreeDsStatus('completed');
                } else {
                    setThreeDsStatus('failed');
                    setError(`Payment ${finalResult.payment.status}: ${finalResult.payment.error?.message || 'Unknown error'}`);
                }

                return finalResult;
            } catch (err) {
                setThreeDsStatus('failed');
                const errorMsg = err instanceof Error ? err.message : 'Failed to complete 3DS challenge';
                setError(errorMsg);
                throw err;
            }
        },
        [startChallenge, config.backendClient],
    );

    /**
     * Process payment
     * 
     * SERVER-SIDE: Processes payment
     * CLIENT-SIDE: Handles 3DS challenge if required
     * 
     * @returns Final payment result (after 3DS if required)
     */
    const processPayment = useCallback(
        async (params: ProcessPaymentParams) => {
            setIsLoading(true);
            setError(null);
            setThreeDsStatus('idle');

            try {
                // 🔴 SERVER-SIDE: Process payment
                console.log('🔴 BACKEND: Processing payment...');
                const result = await config.backendClient.processPayment(params);

                // 🟢 CLIENT-SIDE: Check if 3DS authentication is required
                if (result.payment.requireAction !== 'none') {
                    const actionData = result.payment.requireActionData;

                    if (actionData?.type === 'threeds_auth' && actionData.metadata?.threedsSession) {
                        setThreeDsStatus('required');

                        // Handle 3DS and get final payment result
                        const finalResult = await handle3DSChallenge(result.payment);

                        // Return final result (after 3DS polling)
                        if (finalResult) {
                            return finalResult;
                        }
                    }
                }

                // No 3DS required - return initial result
                return result;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to process payment';
                setError(errorMsg);
                setThreeDsStatus('failed');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [config.backendClient, handle3DSChallenge],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const resetThreeDsStatus = useCallback(() => {
        setThreeDsStatus('idle');
        setError(null);
    }, []);

    return {
        // Methods
        createPaymentInstrument,
        create3DSSession,
        processPayment,

        // State
        isLoading: isLoading || isThreeDsLoading,
        error: error || (threeDsError?.message ?? null),
        threeDsStatus,

        // Utilities
        clearError,
        resetThreeDsStatus,
    };
}

