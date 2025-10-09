import { useState, useEffect } from 'react';
import { CardForm } from './components/CardForm';
import type { TagadaToken } from './components/CardForm';
import type { CardTokenResponse } from '@tagadapay/core-js/react';
import { useThreeds } from '@tagadapay/core-js/react';
import { HistorySidebar } from './components/HistorySidebar';
import {
  saveTokenToHistory,
  saveCurrentStore,
  getCurrentStore,
  getTokenHistory,
  getStoreHistory,
} from './utils/localStorage';
import './App.css';

interface TokenResult {
  tagadaToken: string;
  originalToken: CardTokenResponse;
  decodedTagadaToken: TagadaToken;
}

interface PaymentInstrumentResult {
  paymentInstrument: {
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
  };
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };
}

interface PaymentResult {
  payment: {
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
  };
}

interface ThreedsSessionResult {
  id: string;
  externalSessionId: string;
  provider: string;
  status: string;
  paymentInstrumentId: string;
  createdAt: string;
}

function App() {
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const [apiToken, setApiToken] = useState<string>('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('https://app.tagadapay.com');
  const [paymentInstrumentResult, setPaymentInstrumentResult] = useState<PaymentInstrumentResult | null>(
    null,
  );
  const [isCreatingPaymentInstrument, setIsCreatingPaymentInstrument] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(2999); // $29.99 default
  const [storeId, setStoreId] = useState<string>('store_eaa20d619f6b');
  const [apiError, setApiError] = useState<string | null>(null);
  const [threedsSessionResult, setThreedsSessionResult] = useState<ThreedsSessionResult | null>(null);
  const [isCreatingThreedsSession, setIsCreatingThreedsSession] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [threeDsStatus, setThreeDsStatus] = useState<
    'idle' | 'required' | 'in_progress' | 'completed' | 'failed'
  >('idle');
  const [lastChallengeData, setLastChallengeData] = useState<PaymentResult | null>(null);

  // Load store from localStorage on mount
  useEffect(() => {
    const savedStore = getCurrentStore();
    if (savedStore) {
      setStoreId(savedStore);
    }
  }, []);

  // Initialize 3DS hook (without backend config - we'll handle that manually)
  const {
    createSession: createLocalSession,
    startChallenge,
    isLoading: isThreeDsLoading,
    error: threeDsError,
  } = useThreeds({
    environment: 'production',
    autoInitialize: true,
  });

  const handleTokenized = (tagadaToken: string, originalToken: CardTokenResponse) => {
    // Decode the TagadaToken for display purposes
    const decodedTagadaToken = JSON.parse(atob(tagadaToken)) as TagadaToken;

    setTokenResult({
      tagadaToken,
      originalToken,
      decodedTagadaToken,
    });

    // Save to history
    saveTokenToHistory({
      tagadaToken,
      cardLast4: decodedTagadaToken.nonSensitiveMetadata.last4,
      cardBrand: decodedTagadaToken.nonSensitiveMetadata.brand,
    });
  };

  const handleSelectTokenFromHistory = (tagadaToken: string, decodedToken: TagadaToken) => {
    // Reconstruct the original token format (we don't have full CardTokenResponse in history)
    const mockOriginalToken: CardTokenResponse = {
      id: decodedToken.token,
      type: 'card',
      enrichments: {
        cardDetails: {
          bin: decodedToken.nonSensitiveMetadata.bin,
          last4: decodedToken.nonSensitiveMetadata.last4,
          brand: decodedToken.nonSensitiveMetadata.brand,
        },
      },
    };

    setTokenResult({
      tagadaToken,
      originalToken: mockOriginalToken,
      decodedTagadaToken: decodedToken,
    });

    // Close history sidebar
    setShowHistory(false);
  };

  const handleSelectStoreFromHistory = (selectedStoreId: string) => {
    setStoreId(selectedStoreId);
    saveCurrentStore(selectedStoreId);
    setShowHistory(false);
  };

  const resetToken = () => {
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setPaymentResult(null);
    setApiError(null);
    setThreedsSessionResult(null);
    setThreeDsStatus('idle');
  };

  const copyToClipboard = async () => {
    if (tokenResult) {
      await navigator.clipboard.writeText(tokenResult.tagadaToken);
      // You could add a toast notification here
    }
  };

  const createPaymentInstrument = async () => {
    if (!tokenResult || !apiToken.trim() || !storeId.trim()) {
      setApiError('Please provide API token and Store ID');
      return;
    }

    setIsCreatingPaymentInstrument(true);
    setApiError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/v1/payment-instruments/create-from-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({
          tagadaToken: tokenResult.tagadaToken,
          storeId: storeId.trim(),
          customerData: {
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PaymentInstrumentResult = await response.json();
      setPaymentInstrumentResult(result);

      // Save store to history
      saveCurrentStore(storeId.trim());
    } catch (error) {
      console.error('Error creating payment instrument:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to create payment instrument');
    } finally {
      setIsCreatingPaymentInstrument(false);
    }
  };

  const createThreedsSession = async () => {
    if (!paymentInstrumentResult || !apiToken.trim() || !storeId.trim() || !tokenResult) {
      setApiError('Payment instrument, API token, and Store ID are required');
      return;
    }

    setIsCreatingThreedsSession(true);
    setApiError(null);

    try {
      // Step 1: Use core-js SDK hook to create session with BasisTheory SDK (local)
      console.log('🔐 Step 1: Creating local 3DS session with BasisTheory SDK...');
      const localSession = await createLocalSession(
        {
          id: paymentInstrumentResult.paymentInstrument.id,
          token: tokenResult.decodedTagadaToken.token,
          type: paymentInstrumentResult.paymentInstrument.type,
          card: {
            expirationMonth: paymentInstrumentResult.paymentInstrument.card.expMonth,
            expirationYear: paymentInstrumentResult.paymentInstrument.card.expYear,
            last4: paymentInstrumentResult.paymentInstrument.card.last4,
            bin: tokenResult.decodedTagadaToken.nonSensitiveMetadata.bin,
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

      console.log('✅ BasisTheory session created:', {
        sessionId: localSession.sessionId,
        provider: localSession.provider,
        raw: localSession.metadata?.raw,
      });

      // Step 2: Manually persist the BasisTheory session data to backend
      console.log('💾 Step 2: Persisting session to backend API...');
      const response = await fetch(`${apiBaseUrl}/api/public/v1/threeds/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({
          provider: localSession.provider,
          storeId: storeId.trim(),
          paymentInstrumentId: paymentInstrumentResult.paymentInstrument.id,
          sessionData: localSession.metadata?.raw || localSession, // Send BasisTheory session data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const persistedSession: ThreedsSessionResult = await response.json();
      console.log('✅ Session persisted to database:', persistedSession.id);

      setThreedsSessionResult(persistedSession);
    } catch (error) {
      console.error('Error creating 3DS session:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to create 3DS session');
    } finally {
      setIsCreatingThreedsSession(false);
    }
  };

  // Poll payment status after 3DS
  const pollPaymentStatus = async (paymentId: string, maxAttempts = 20): Promise<PaymentResult> => {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${apiToken.trim()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const data = await response.json();

      // Handle both response formats: { payment: {...} } or direct payment object
      const payment = data.payment || data;

      if (!payment || !payment.status) {
        console.error('Invalid payment response:', data);
        throw new Error('Invalid payment response from server');
      }

      const result: PaymentResult = { payment };

      // Check if payment is complete
      if (payment.status === 'succeeded' || payment.status === 'failed' || payment.status === 'declined') {
        console.log(`✅ Payment polling complete: ${payment.status}`);
        return result;
      }

      console.log(`⏳ Polling attempt ${i + 1}/${maxAttempts}, status: ${payment.status}`);

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Payment verification timeout');
  };

  // Handle 3DS challenge (matches CMS usePayment.ts logic exactly)
  const handle3DSChallenge = async (paymentResult: PaymentResult) => {
    const actionData = paymentResult.payment.requireActionData;

    // Check exact same fields as usePayment.ts
    if (!actionData?.metadata?.threedsSession) {
      console.log('No 3DS session data found in requireActionData');
      return;
    }

    const { threedsSession } = actionData.metadata;

    // Save challenge data for retry
    setLastChallengeData(paymentResult);
    setThreeDsStatus('in_progress');

    try {
      console.log('Starting 3DS challenge...');

      // Start challenge with exact same structure as usePayment.ts
      const challengeCompletion = await startChallenge({
        sessionId: threedsSession.externalSessionId,
        acsChallengeUrl: threedsSession.acsChallengeUrl,
        acsTransactionId: threedsSession.acsTransID,
        threeDSVersion: threedsSession.messageVersion,
      });

      console.log('3DS challenge completed');
      console.log('challengeCompletion', challengeCompletion);
      setThreeDsStatus('completed');

      // Poll for payment status after 3DS completion
      console.log('Starting polling for payment status...');
      const finalResult = await pollPaymentStatus(paymentResult.payment.id);
      setPaymentResult(finalResult);

      if (finalResult.payment.status === 'succeeded') {
        setThreeDsStatus('completed');
      } else {
        setThreeDsStatus('failed');
        setApiError('Payment failed after 3DS authentication');
      }
    } catch (error) {
      setThreeDsStatus('failed');
      console.error('Error starting 3DS challenge:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to start 3DS challenge');
      throw error;
    }
  };

  // Retry 3DS challenge
  const retryChallenge = async () => {
    if (!lastChallengeData) {
      setApiError('No challenge data available to retry');
      return;
    }

    setApiError(null);
    setThreeDsStatus('idle');

    try {
      // Re-run the challenge with saved data
      await handle3DSChallenge(lastChallengeData);
    } catch (error) {
      // Error is already handled in handle3DSChallenge
      console.error('Retry failed:', error);
    }
  };

  const processPayment = async () => {
    if (!paymentInstrumentResult || !apiToken.trim()) {
      setApiError('Payment instrument and API token are required');
      return;
    }

    setIsProcessingPayment(true);
    setApiError(null);
    setThreeDsStatus('idle');

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/v1/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'USD',
          storeId: storeId,
          paymentInstrumentId: paymentInstrumentResult.paymentInstrument.id,
          ...(threedsSessionResult && { threedsSessionId: threedsSessionResult.id }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PaymentResult = await response.json();
      setPaymentResult(result);

      // Check if 3DS authentication is required (exact same check as usePayment.ts)
      if (result.payment.requireAction !== 'none') {
        const actionData = result.payment.requireActionData;

        if (actionData?.type === 'threeds_auth' && actionData.metadata?.threedsSession) {
          setThreeDsStatus('required');
          await handle3DSChallenge(result);
        }
      } else if (result.payment.status === 'succeeded') {
        // Payment succeeded without 3DS
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to process payment');
      setThreeDsStatus('failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="from-primary-50 via-accent-50 to-primary-100 flex min-h-screen bg-gradient-to-br">
      {/* History Sidebar */}
      {showHistory && (
        <HistorySidebar
          onSelectToken={handleSelectTokenFromHistory}
          onSelectStore={handleSelectStoreFromHistory}
        />
      )}

      {/* Main Container */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Compact Header */}
        <header className="border-primary-200/50 border-b bg-white/90 shadow-sm backdrop-blur-md">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <h1 className="from-primary-800 to-accent-700 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                  TagadaPay Card Tokenization
                </h1>
                <p className="text-primary-600 mx-auto mt-2 max-w-xl text-sm">
                  Complete payment demo with 3DS: Tokenize → Create PI → Create 3DS Session (optional) →
                  Process Payment with{' '}
                  <code className="bg-primary-100 text-primary-700 rounded px-1 py-0.5 font-mono text-xs">
                    @tagadapay/core-js
                  </code>
                </p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {showHistory ? '✕ Close' : '📋 History'}
                {(getTokenHistory().length > 0 || getStoreHistory().length > 0) && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    {getTokenHistory().length + getStoreHistory().length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-2xl">
            {!tokenResult ? (
              <CardForm onTokenized={handleTokenized} />
            ) : (
              <div className="space-y-8">
                {/* Step Progress Indicator */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center">
                    <div className="bg-accent-600 flex h-8 w-8 items-center justify-center rounded-full text-white">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <span className="text-primary-700 ml-2 text-xs font-medium">Tokenize</span>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        paymentInstrumentResult ? 'bg-accent-600' : 'bg-primary-300'
                      }`}
                    >
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <span className="text-primary-700 ml-2 text-xs font-medium">Create PI</span>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        threedsSessionResult ? 'bg-accent-600' : 'bg-blue-300'
                      }`}
                    >
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <span className="text-primary-700 ml-2 text-xs font-medium">3DS Session</span>
                    <span className="text-primary-500 ml-1 text-xs italic">(optional)</span>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        paymentResult ? 'bg-accent-600' : 'bg-primary-300'
                      }`}
                    >
                      <span className="text-sm font-bold">4</span>
                    </div>
                    <span className="text-primary-700 ml-2 text-xs font-medium">Payment</span>
                  </div>
                </div>

                {/* Step 1 - Token Display */}
                <div className="border-primary-200 rounded-xl border bg-white p-6 shadow-lg">
                  <div className="mb-4 text-center">
                    <h3 className="text-primary-800 mb-1 text-lg font-bold">
                      🎯 Step 1: Secure Payment Token
                    </h3>
                    <p className="text-primary-600 text-sm">TagadaToken (Base64)</p>
                  </div>

                  <div className="relative">
                    <div className="border-primary-200 bg-primary-900 rounded-lg border p-4">
                      <code className="text-accent-400 block break-all font-mono text-xs leading-relaxed">
                        {tokenResult.tagadaToken}
                      </code>
                    </div>

                    <button
                      onClick={copyToClipboard}
                      className="bg-accent-600 hover:bg-accent-700 absolute right-2 top-2 rounded px-3 py-1 text-xs font-medium text-white shadow transition-all duration-200"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-primary-600 text-xs">
                      ✅ Token created successfully - Ready for Step 2
                    </p>
                  </div>
                </div>

                {/* Step 2 - API Configuration */}
                {!paymentInstrumentResult && !paymentResult && (
                  <div className="border-primary-200 rounded-xl border bg-white p-6 shadow-lg">
                    <div className="mb-4 text-center">
                      <h3 className="text-primary-800 mb-1 text-lg font-bold">
                        🚀 Step 2: Create Payment Instrument
                      </h3>
                      <p className="text-primary-600 text-sm">Send token to TagadaPay API</p>
                    </div>

                    <div className="space-y-4">
                      {/* API Base URL */}
                      <div>
                        <label
                          htmlFor="apiBaseUrl"
                          className="text-primary-700 mb-1 block text-xs font-semibold"
                        >
                          API Base URL
                        </label>
                        <input
                          id="apiBaseUrl"
                          type="text"
                          value={apiBaseUrl}
                          onChange={(e) => setApiBaseUrl(e.target.value)}
                          className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                          placeholder="https://app.tagadapay.com"
                        />
                      </div>

                      {/* API Token */}
                      <div>
                        <label
                          htmlFor="apiToken"
                          className="text-primary-700 mb-1 block text-xs font-semibold"
                        >
                          API Access Token (org:admin required)
                        </label>
                        <input
                          id="apiToken"
                          type="password"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                          placeholder="Enter your API token..."
                        />
                        <p className="text-primary-500 mt-1 text-xs">
                          Get your API token from TagadaPay dashboard → API Keys
                        </p>
                      </div>

                      {/* API Error */}
                      {apiError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                          <p className="text-sm">❌ {apiError}</p>
                        </div>
                      )}

                      {/* Store ID */}
                      <div>
                        <label
                          htmlFor="storeIdInput"
                          className="text-primary-700 mb-1 block text-xs font-semibold"
                        >
                          Store ID
                        </label>
                        <input
                          id="storeIdInput"
                          type="text"
                          value={storeId}
                          onChange={(e) => {
                            setStoreId(e.target.value);
                            if (e.target.value.trim()) {
                              saveCurrentStore(e.target.value.trim());
                            }
                          }}
                          className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                          placeholder="store_eaa20d619f6b"
                        />
                        <p className="text-primary-500 mt-1 text-xs">
                          Your TagadaPay store ID (saved automatically)
                        </p>
                      </div>

                      {/* Create Button */}
                      <button
                        onClick={createPaymentInstrument}
                        disabled={isCreatingPaymentInstrument || !apiToken.trim() || !storeId.trim()}
                        className="bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isCreatingPaymentInstrument ? (
                          <span className="flex items-center justify-center">
                            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                opacity="0.25"
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Creating Payment Instrument...
                          </span>
                        ) : (
                          '🎯 Create Payment Instrument'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 - Success Result */}
                {paymentInstrumentResult && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-lg">
                    <div className="mb-4 text-center">
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg
                          className="h-6 w-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-green-800">
                        🎉 Payment Instrument Created!
                      </h3>
                      <p className="text-sm text-green-600">Successfully created via TagadaPay API</p>
                    </div>

                    <div className="rounded-lg bg-white p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-primary-800 mb-2 font-semibold">Payment Instrument</h4>
                          <div className="text-primary-600 space-y-1 text-sm">
                            <p>
                              <strong>ID:</strong> {paymentInstrumentResult.paymentInstrument.id}
                            </p>
                            <p>
                              <strong>Type:</strong> {paymentInstrumentResult.paymentInstrument.type}
                            </p>
                            <p>
                              <strong>Card:</strong> **** **** ****{' '}
                              {paymentInstrumentResult.paymentInstrument.card.last4}
                            </p>
                            <p>
                              <strong>Brand:</strong> {paymentInstrumentResult.paymentInstrument.card.brand}
                            </p>
                            <p>
                              <strong>Expires:</strong>{' '}
                              {paymentInstrumentResult.paymentInstrument.card.expMonth}/
                              {paymentInstrumentResult.paymentInstrument.card.expYear}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-primary-800 mb-2 font-semibold">Customer</h4>
                          <div className="text-primary-600 space-y-1 text-sm">
                            <p>
                              <strong>ID:</strong> {paymentInstrumentResult.customer.id}
                            </p>
                            <p>
                              <strong>Email:</strong> {paymentInstrumentResult.customer.email}
                            </p>
                            <p>
                              <strong>Name:</strong> {paymentInstrumentResult.customer.firstName}{' '}
                              {paymentInstrumentResult.customer.lastName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3DS Session Button (Optional) */}
                    {!threedsSessionResult && (
                      <div className="mt-4">
                        <button
                          onClick={createThreedsSession}
                          disabled={isCreatingThreedsSession || isThreeDsLoading}
                          className="w-full rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCreatingThreedsSession || isThreeDsLoading ? (
                            <span className="flex items-center justify-center">
                              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                  opacity="0.25"
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Creating 3DS Session...
                            </span>
                          ) : (
                            '🔐 Create 3DS Session (Optional - Recommended)'
                          )}
                        </button>
                        <p className="mt-2 text-center text-xs text-blue-600">
                          <strong>Step 1:</strong> SDK creates session with BasisTheory{' '}
                          <strong>→ Step 2:</strong> Persists to backend
                        </p>
                      </div>
                    )}

                    {/* 3DS Error */}
                    {threeDsError && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-700">
                          ❌ <strong>3DS SDK Error:</strong> {threeDsError.message}
                        </p>
                      </div>
                    )}

                    {/* 3DS Session Created Indicator */}
                    {threedsSessionResult && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                        <div className="space-y-1">
                          <p className="text-sm text-green-700">
                            ✅ <strong>3DS Session Created!</strong> Payment will use this session.
                          </p>
                          <div className="text-xs text-green-600">
                            <p>
                              <strong>Database ID:</strong>{' '}
                              <code className="rounded bg-green-100 px-1 font-mono">
                                {threedsSessionResult.id}
                              </code>
                            </p>
                            <p>
                              <strong>BasisTheory ID:</strong>{' '}
                              <code className="rounded bg-green-100 px-1 font-mono">
                                {threedsSessionResult.externalSessionId}
                              </code>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 - Payment Processing */}
                {paymentInstrumentResult && !paymentResult && (
                  <div className="border-primary-200 rounded-xl border bg-white p-6 shadow-lg">
                    <div className="mb-4 text-center">
                      <h3 className="text-primary-800 mb-1 text-lg font-bold">
                        💳 Step 4: Process Demo Payment
                      </h3>
                      <p className="text-primary-600 text-sm">
                        {threedsSessionResult
                          ? 'Payment will use pre-created 3DS session'
                          : 'Test the payment flow'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Payment Amount */}
                      <div>
                        <label
                          htmlFor="paymentAmount"
                          className="text-primary-700 mb-1 block text-xs font-semibold"
                        >
                          Payment Amount (cents)
                        </label>
                        <input
                          id="paymentAmount"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                          placeholder="2999"
                        />
                        <p className="text-primary-500 mt-1 text-xs">Amount in cents (e.g., 2999 = $29.99)</p>
                      </div>

                      {/* Store ID */}
                      <div>
                        <label
                          htmlFor="storeId"
                          className="text-primary-700 mb-1 block text-xs font-semibold"
                        >
                          Store ID
                        </label>
                        <input
                          id="storeId"
                          type="text"
                          value={storeId}
                          onChange={(e) => setStoreId(e.target.value)}
                          className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                          placeholder="store_eaa20d619f6b"
                        />
                      </div>

                      {/* Payment Details Summary */}
                      <div className="bg-primary-50 rounded-lg p-3">
                        <h4 className="text-primary-800 mb-2 text-sm font-semibold">Payment Summary</h4>
                        <div className="text-primary-600 space-y-1 text-xs">
                          <p>
                            <strong>Card:</strong> **** **** ****{' '}
                            {paymentInstrumentResult.paymentInstrument.card.last4}
                          </p>
                          <p>
                            <strong>Amount:</strong> ${(paymentAmount / 100).toFixed(2)} USD
                          </p>
                          <p>
                            <strong>Customer:</strong> {paymentInstrumentResult.customer.email}
                          </p>
                          <p>
                            <strong>Payment Instrument ID:</strong>{' '}
                            {paymentInstrumentResult.paymentInstrument.id}
                          </p>
                        </div>
                      </div>

                      {/* API Error */}
                      {apiError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                          <p className="text-sm">❌ {apiError}</p>
                        </div>
                      )}

                      {/* 3DS Error */}
                      {threeDsError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                          <p className="text-sm">🔐 3DS Error: {threeDsError.message}</p>
                        </div>
                      )}

                      {/* 3DS Status Info */}
                      {threeDsStatus === 'required' && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-700">
                          <p className="text-sm">
                            🔐 3DS Authentication Required - Please complete the challenge
                          </p>
                        </div>
                      )}

                      {threeDsStatus === 'in_progress' && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700">
                          <p className="text-sm">🔐 3DS Authentication in Progress...</p>
                        </div>
                      )}

                      {/* Process Payment Button */}
                      <button
                        onClick={processPayment}
                        disabled={
                          isProcessingPayment || isThreeDsLoading || !paymentAmount || !storeId.trim()
                        }
                        className="bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isProcessingPayment || isThreeDsLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                opacity="0.25"
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            {threeDsStatus === 'in_progress' ? 'Completing 3DS...' : 'Processing Payment...'}
                          </span>
                        ) : (
                          '💳 Process Demo Payment'
                        )}
                      </button>

                      {/* 3DS Info */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="space-y-2 text-xs text-blue-700">
                          <p>
                            <strong>ℹ️ 3DS Authentication:</strong> If your payment requires 3DS verification,
                            a secure modal will automatically appear.
                          </p>
                          {threedsSessionResult ? (
                            <p className="rounded bg-blue-100 p-2">
                              <strong>✅ 3DS Session Ready:</strong> Payment will use pre-created session for
                              faster processing.
                            </p>
                          ) : (
                            <p className="rounded bg-yellow-50 p-2 text-yellow-700">
                              <strong>💡 Recommended:</strong> Create a 3DS session above for improved
                              security.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 - Payment Result */}
                {paymentResult && (
                  <div
                    className={`rounded-xl border p-6 shadow-lg ${
                      paymentResult.payment.status === 'succeeded'
                        ? 'border-green-200 bg-green-50'
                        : paymentResult.payment.status === 'declined' ||
                            paymentResult.payment.status === 'rejected'
                          ? 'border-red-200 bg-red-50'
                          : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="mb-4 text-center">
                      <div
                        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${
                          paymentResult.payment.status === 'succeeded'
                            ? 'bg-green-100'
                            : paymentResult.payment.status === 'declined' ||
                                paymentResult.payment.status === 'rejected'
                              ? 'bg-red-100'
                              : 'bg-yellow-100'
                        }`}
                      >
                        <svg
                          className={`h-6 w-6 ${
                            paymentResult.payment.status === 'succeeded'
                              ? 'text-green-600'
                              : paymentResult.payment.status === 'declined' ||
                                  paymentResult.payment.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {paymentResult.payment.status === 'succeeded' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          ) : paymentResult.payment.status === 'declined' ||
                            paymentResult.payment.status === 'rejected' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          )}
                        </svg>
                      </div>
                      <h3
                        className={`mb-1 text-lg font-bold ${
                          paymentResult.payment.status === 'succeeded'
                            ? 'text-green-800'
                            : paymentResult.payment.status === 'declined' ||
                                paymentResult.payment.status === 'rejected'
                              ? 'text-red-800'
                              : 'text-yellow-800'
                        }`}
                      >
                        {paymentResult.payment.status === 'succeeded'
                          ? '🎉 Payment Processed Successfully!'
                          : paymentResult.payment.status === 'declined' ||
                              paymentResult.payment.status === 'rejected'
                            ? '❌ Payment Declined'
                            : '⏳ Payment Processing'}
                      </h3>
                      <p
                        className={`text-sm ${
                          paymentResult.payment.status === 'succeeded'
                            ? 'text-green-600'
                            : paymentResult.payment.status === 'declined' ||
                                paymentResult.payment.status === 'rejected'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {threeDsStatus === 'completed'
                          ? 'Complete flow with 3DS authentication'
                          : paymentResult.payment.requireAction === 'threeds_auth'
                            ? 'Waiting for 3DS authentication'
                            : 'Complete payment flow demonstration'}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-primary-800 mb-2 font-semibold">Payment Details</h4>
                          <div className="text-primary-600 space-y-1 text-sm">
                            <p>
                              <strong>ID:</strong> {paymentResult.payment.id}
                            </p>
                            <p>
                              <strong>Amount:</strong> ${(paymentResult.payment.amount / 100).toFixed(2)}{' '}
                              {paymentResult.payment.currency}
                            </p>
                            <p>
                              <strong>Status:</strong>{' '}
                              <span className="font-medium text-green-600">
                                {paymentResult.payment.status}
                              </span>
                            </p>
                            <p>
                              <strong>Sub Status:</strong> {paymentResult.payment.subStatus}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-primary-800 mb-2 font-semibold">Transaction Info</h4>
                          <div className="text-primary-600 space-y-1 text-sm">
                            <p>
                              <strong>Created:</strong>{' '}
                              {new Date(paymentResult.payment.createdAt).toLocaleString()}
                            </p>
                            <p>
                              <strong>Action Required:</strong>{' '}
                              <span
                                className={
                                  paymentResult.payment.requireAction === 'threeds_auth'
                                    ? 'text-yellow-600'
                                    : ''
                                }
                              >
                                {paymentResult.payment.requireAction}
                              </span>
                            </p>
                            <p>
                              <strong>Card:</strong> **** **** ****{' '}
                              {paymentInstrumentResult?.paymentInstrument.card.last4}
                            </p>
                          </div>
                        </div>

                        {/* 3DS Authentication Info */}
                        {paymentResult.payment.requireActionData?.type === 'threeds_auth' && (
                          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <h4 className="mb-2 text-sm font-semibold text-blue-800">
                              🔐 3DS Authentication
                            </h4>
                            <div className="space-y-1 text-xs text-blue-700">
                              <p>
                                <strong>Status:</strong>{' '}
                                {threeDsStatus === 'completed'
                                  ? '✅ Completed'
                                  : threeDsStatus === 'in_progress'
                                    ? '⏳ In Progress'
                                    : threeDsStatus === 'failed'
                                      ? '❌ Failed'
                                      : '⏸️ Required'}
                              </p>
                              {paymentResult.payment.requireActionData.metadata?.threedsSession && (
                                <>
                                  <p>
                                    <strong>Version:</strong>{' '}
                                    {
                                      paymentResult.payment.requireActionData.metadata.threedsSession
                                        .messageVersion
                                    }
                                  </p>
                                  <p className="mt-2 rounded bg-blue-100 p-2 font-mono text-xs">
                                    Session:{' '}
                                    {
                                      paymentResult.payment.requireActionData.metadata.threedsSession
                                        .externalSessionId
                                    }
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Success message for completed 3DS */}
                        {threeDsStatus === 'completed' && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-700">
                              ✅ <strong>3DS Authentication Successful!</strong> Payment completed after
                              secure verification.
                            </p>
                          </div>
                        )}

                        {/* Failed message with retry button */}
                        {threeDsStatus === 'failed' && lastChallengeData && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                            <div className="space-y-2">
                              <p className="text-sm text-red-700">
                                ❌ <strong>3DS Authentication Failed</strong>
                              </p>
                              <p className="text-xs text-red-600">
                                {apiError || 'The authentication challenge could not be completed'}
                              </p>
                              <button
                                onClick={retryChallenge}
                                disabled={isThreeDsLoading}
                                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                              >
                                {isThreeDsLoading ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        opacity="0.25"
                                      />
                                      <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Retrying...
                                  </span>
                                ) : (
                                  '🔄 Retry 3DS Challenge'
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  {threeDsStatus === 'failed' && lastChallengeData && (
                    <button
                      onClick={retryChallenge}
                      disabled={isThreeDsLoading}
                      className="rounded-lg bg-yellow-600 px-6 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isThreeDsLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              opacity="0.25"
                            />
                            <path
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Retrying 3DS...
                        </span>
                      ) : (
                        '🔄 Retry 3DS Challenge'
                      )}
                    </button>
                  )}
                  <button
                    onClick={resetToken}
                    className="bg-accent-600 hover:bg-accent-700 rounded-lg px-6 py-2 text-sm font-medium text-white shadow transition-all duration-200"
                  >
                    🔄 Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
