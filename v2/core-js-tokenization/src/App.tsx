import { useState, useEffect, useMemo } from 'react';
import { CardForm } from './components/CardForm';
import type { TagadaToken } from './components/CardForm';
import type { CardTokenResponse } from '@tagadapay/core-js/react';
import { usePaymentFlow } from './hooks/usePaymentFlow';
import { DemoBackendClient } from './api/paymentBackend';
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
    error?: {
      code?: string;
      message?: string;
      processorCode?: string;
      processorMessage?: string;
    };
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
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(2999); // $29.99 default
  const [storeId, setStoreId] = useState<string>('store_eaa20d619f6b');
  const [threedsSessionResult, setThreedsSessionResult] = useState<ThreedsSessionResult | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [skipMethodRequest, setSkipMethodRequest] = useState<boolean>(false);

  // Load store from localStorage on mount
  useEffect(() => {
    const savedStore = getCurrentStore();
    if (savedStore) {
      setStoreId(savedStore);
    }
  }, []);

  // 🟢 CLIENT: Create backend client (memoized to avoid recreating on every render)
  const backendClient = useMemo(
    () => new DemoBackendClient(apiBaseUrl, () => apiToken),
    [apiBaseUrl, apiToken],
  );

  // 🟢 CLIENT: Use the simplified payment flow hook
  const {
    createPaymentInstrument: createPI,
    create3DSSession: create3DS,
    processPayment: processPaymentAPI,
    isLoading,
    error: paymentFlowError,
    threeDsStatus,
    clearError,
    resetThreeDsStatus,
  } = usePaymentFlow({
    backendClient,
    environment: 'production',
  });

  const handleTokenized = (tagadaToken: string, rawToken: CardTokenResponse) => {
    // Decode the TagadaToken for display purposes
    const decodedTagadaToken = JSON.parse(atob(tagadaToken)) as TagadaToken;

    // Log SCA requirement (from normalized metadata)
    console.log('🔐 SCA/3DS Detection:');
    console.log('  - metadata.auth.scaRequired:', rawToken.metadata?.auth?.scaRequired);
    console.log('  - Provider-agnostic check works with any tokenization provider!');

    setTokenResult({
      tagadaToken,
      originalToken: rawToken, // Store rawToken from SDK (includes metadata.auth.scaRequired)
      decodedTagadaToken,
    });

    // Save to history
    saveTokenToHistory({
      tagadaToken,
      cardLast4: decodedTagadaToken.nonSensitiveMetadata.last4 || 'Unknown',
      cardBrand: decodedTagadaToken.nonSensitiveMetadata.brand || 'Unknown',
    });
  };

  const handleSelectTokenFromHistory = (tagadaToken: string, decodedToken: TagadaToken) => {
    // Reconstruct the original token format from TagadaToken metadata
    const mockOriginalToken: CardTokenResponse = {
      id: decodedToken.token,
      type: 'card',
      data: {},
      metadata: {
        auth: {
          scaRequired: decodedToken.nonSensitiveMetadata.authentication === 'sca_required',
        },
        tokenizedAt: decodedToken.nonSensitiveMetadata.createdAt,
      },
    };

    setTokenResult({
      tagadaToken,
      originalToken: mockOriginalToken, // Now includes metadata.auth.scaRequired
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
    setThreedsSessionResult(null);
    clearError();
  };

  const copyToClipboard = async () => {
    if (tokenResult) {
      await navigator.clipboard.writeText(tokenResult.tagadaToken);
      // You could add a toast notification here
    }
  };

  // Check if 3DS/SCA is required (provider-agnostic via normalized metadata)
  const isScaRequired = () => {
    // ✅ RECOMMENDED: Use normalized metadata from rawToken
    // The SDK automatically detects SCA requirement from any provider
    // and normalizes it to metadata.auth.scaRequired
    //
    // This works with BasisTheory, Stripe, Adyen, or any other provider!
    return tokenResult?.originalToken?.metadata?.auth?.scaRequired === true;
  };

  // 🟢 CLIENT: Simplified payment instrument creation using hook
  const createPaymentInstrument = async () => {
    if (!tokenResult || !apiToken.trim() || !storeId.trim()) {
      return;
    }

    clearError();

    try {
      const result = await createPI({
        tagadaToken: tokenResult.tagadaToken,
        storeId: storeId.trim(),
        customerData: {
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
        },
      });

      setPaymentInstrumentResult(result);

      // Save store to history
      saveCurrentStore(storeId.trim());
    } catch (error) {
      console.error('Error creating payment instrument:', error);
    }
  };

  // 🟢 CLIENT: Simplified 3DS session creation using hook
  const createThreedsSession = async () => {
    if (!paymentInstrumentResult || !tokenResult) {
      return;
    }

    clearError();

    try {
      const session = await create3DS(
        paymentInstrumentResult.paymentInstrument,
        {
          token: tokenResult.decodedTagadaToken.token,
          bin: tokenResult.decodedTagadaToken.nonSensitiveMetadata.bin,
        },
        {
          amount: paymentAmount,
          currency: 'USD',
          customerName: `${paymentInstrumentResult.customer.firstName} ${paymentInstrumentResult.customer.lastName}`,
          customerEmail: paymentInstrumentResult.customer.email,
          storeId: storeId.trim(),
          skipMethodRequest, // Pass toggle state
        },
      );

      setThreedsSessionResult(session);
    } catch (error) {
      console.error('Error creating 3DS session:', error);
    }
  };

  // 🟢 CLIENT: Simplified payment processing using hook
  const processPayment = async () => {
    if (!paymentInstrumentResult) {
      return;
    }

    clearError();

    try {
      const result = await processPaymentAPI({
        amount: paymentAmount,
        currency: 'USD',
        storeId: storeId.trim(),
        paymentInstrumentId: paymentInstrumentResult.paymentInstrument.id,
        ...(threedsSessionResult && { threedsSessionId: threedsSessionResult.id }),
      });

      // Log final payment result (after 3DS if required)
      console.log('💰 Final payment result:', {
        id: result.payment.id,
        status: result.payment.status,
        subStatus: result.payment.subStatus,
        error: result.payment.error,
      });

      setPaymentResult(result);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  // 🔄 Retry 3DS from beginning: Recreate session and process payment
  const retry3DSFromBeginning = async () => {
    if (!paymentInstrumentResult || !tokenResult) {
      return;
    }

    console.log('🔄 Retrying 3DS flow from the beginning...');

    // Reset states
    resetThreeDsStatus();
    setThreedsSessionResult(null);
    setPaymentResult(null);

    try {
      // Step 1: Create new 3DS session
      console.log('Step 1: Creating new 3DS session...');
      const newSession = await create3DS(
        paymentInstrumentResult.paymentInstrument,
        {
          token: tokenResult.decodedTagadaToken.token,
          bin: tokenResult.decodedTagadaToken.nonSensitiveMetadata.bin,
        },
        {
          amount: paymentAmount,
          currency: 'USD',
          customerName: `${paymentInstrumentResult.customer.firstName} ${paymentInstrumentResult.customer.lastName}`,
          customerEmail: paymentInstrumentResult.customer.email,
          storeId: storeId.trim(),
          skipMethodRequest, // Pass toggle state
        },
      );

      setThreedsSessionResult(newSession);
      console.log('✅ New 3DS session created:', newSession.id);

      // Step 2: Process payment with new session
      console.log('Step 2: Processing payment with new 3DS session...');
      const result = await processPaymentAPI({
        amount: paymentAmount,
        currency: 'USD',
        storeId: storeId.trim(),
        paymentInstrumentId: paymentInstrumentResult.paymentInstrument.id,
        threedsSessionId: newSession.id,
      });

      // Log final result (after 3DS polling)
      console.log('💰 Final payment result after retry:', {
        id: result.payment.id,
        status: result.payment.status,
        subStatus: result.payment.subStatus,
        error: result.payment.error,
      });

      setPaymentResult(result);
      console.log('✅ Payment processed with new 3DS session');
    } catch (error) {
      console.error('❌ Retry failed:', error);
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
                  Complete payment demo with 3DS using{' '}
                  <code className="bg-primary-100 text-primary-700 rounded px-1 py-0.5 font-mono text-xs">
                    @tagadapay/core-js
                  </code>
                </p>
                {/* Architecture Indicator */}
                <div className="mt-3 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-green-700">🟢 Client-Side</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-red-700">🔴 Server-Side</span>
                  </div>
                </div>
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
            {/* API Configuration - Always visible at top */}
            {tokenResult && (
              <div className="border-primary-200 mb-6 rounded-xl border bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <div className="inline-flex rounded-full bg-red-100 px-3 py-1">
                    <span className="text-xs font-semibold text-red-700">🔴 SERVER CONFIG</span>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* API Base URL */}
                  <div>
                    <label
                      htmlFor="apiBaseUrlTop"
                      className="text-primary-700 mb-1 block text-xs font-semibold"
                    >
                      API Base URL
                    </label>
                    <input
                      id="apiBaseUrlTop"
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      className="border-primary-300 focus:border-accent-500 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                      placeholder="https://app.tagadapay.com"
                    />
                  </div>

                  {/* Store ID */}
                  <div>
                    <label htmlFor="storeIdTop" className="text-primary-700 mb-1 block text-xs font-semibold">
                      Store ID
                    </label>
                    <input
                      id="storeIdTop"
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
                  </div>

                  {/* API Token */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="apiTokenTop"
                      className="text-primary-700 mb-1 block text-xs font-semibold"
                    >
                      API Access Token (org:admin required)
                    </label>
                    <input
                      id="apiTokenTop"
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

                  {/* Error Display */}
                  {paymentFlowError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 md:col-span-2">
                      <p className="text-sm">❌ {paymentFlowError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!tokenResult ? (
              <CardForm onTokenized={handleTokenized} />
            ) : (
              <div className="space-y-8">
                {/* Step Progress Indicator with Client/Server Labels */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex flex-col items-center">
                    <div className="bg-accent-600 flex h-8 w-8 items-center justify-center rounded-full text-white">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <span className="text-primary-700 mt-1 text-xs font-medium">Tokenize</span>
                    <span className="mt-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      🟢 Client
                    </span>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        paymentInstrumentResult ? 'bg-accent-600' : 'bg-primary-300'
                      }`}
                    >
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <span className="text-primary-700 mt-1 text-xs font-medium">Create PI</span>
                    <span className="mt-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      🔴 Server
                    </span>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        threedsSessionResult ? 'bg-accent-600' : 'bg-blue-300'
                      }`}
                    >
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <span className="text-primary-700 mt-1 text-xs font-medium">3DS Session</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                        🟢
                      </span>
                      <span className="text-xs text-gray-400">+</span>
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">🔴</span>
                    </div>
                  </div>
                  <div className="border-primary-300 h-px w-6 border-t"></div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                        paymentResult ? 'bg-accent-600' : 'bg-primary-300'
                      }`}
                    >
                      <span className="text-sm font-bold">4</span>
                    </div>
                    <span className="text-primary-700 mt-1 text-xs font-medium">Payment</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                        🟢
                      </span>
                      <span className="text-xs text-gray-400">+</span>
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">🔴</span>
                    </div>
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
                      <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1">
                        <span className="text-xs font-semibold text-red-700">🔴 SERVER-SIDE</span>
                      </div>
                      <h3 className="text-primary-800 mb-1 text-lg font-bold">
                        🚀 Step 2: Create Payment Instrument
                      </h3>
                      <p className="text-primary-600 text-sm">Send token to TagadaPay API</p>
                    </div>

                    <div className="space-y-4">
                      {/* Config Summary */}
                      <div className="rounded-lg bg-gray-50 p-3">
                        <h4 className="text-primary-800 mb-2 text-sm font-semibold">Configuration</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>
                            <strong>Store ID:</strong> {storeId || 'Not set'}
                          </p>
                          <p>
                            <strong>API Token:</strong> {apiToken ? '••••••••' : 'Not set'}
                          </p>
                          <p className="text-xs text-gray-500">
                            (Configure in the Server Config section above)
                          </p>
                        </div>
                      </div>

                      {/* Create Button */}
                      <button
                        onClick={createPaymentInstrument}
                        disabled={isLoading || !apiToken.trim() || !storeId.trim()}
                        className="bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
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
                            {tokenResult?.originalToken?.metadata?.auth && (
                              <p>
                                <strong>3DS/SCA:</strong>{' '}
                                <span
                                  className={`font-medium ${
                                    isScaRequired() ? 'text-orange-600' : 'text-green-600'
                                  }`}
                                >
                                  {isScaRequired() ? '⚠️ Required' : '✓ Optional'}
                                </span>
                              </p>
                            )}
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

                    {/* 3DS Session Button */}
                    {!threedsSessionResult && (
                      <div className="mt-4">
                        {/* SCA Required Indicator */}
                        {isScaRequired() && (
                          <div className="mb-2 rounded-lg border border-orange-200 bg-orange-50 p-2">
                            <p className="text-center text-xs text-orange-700">
                              <strong>⚠️ SCA Required:</strong> This card requires 3DS authentication
                            </p>
                          </div>
                        )}

                        {/* Skip Method Request Toggle */}
                        <div className="mb-2 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <input
                            type="checkbox"
                            id="skipMethodRequest"
                            checked={skipMethodRequest}
                            onChange={(e) => setSkipMethodRequest(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="skipMethodRequest"
                            className="flex items-center gap-1 text-xs text-gray-700"
                          >
                            <span className="font-medium">⚡ Skip Device Fingerprint</span>
                            <span className="text-gray-500">(faster but may reduce approval rates)</span>
                          </label>
                        </div>

                        <button
                          onClick={createThreedsSession}
                          disabled={isLoading}
                          className={`w-full rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isScaRequired()
                              ? 'border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100'
                              : 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100'
                          }`}
                        >
                          {isLoading ? (
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
                          ) : isScaRequired() ? (
                            '🔐 Create 3DS Session (Required by Card)'
                          ) : (
                            '🔐 Create 3DS Session (Optional - Recommended)'
                          )}
                        </button>
                        <div className="mt-2 rounded-lg bg-gray-50 p-2">
                          <p className="text-center text-xs text-gray-700">
                            <strong className="text-green-600">🟢 Client:</strong> SDK creates session{' '}
                            <span className="text-gray-400">→</span>{' '}
                            <strong className="text-red-600">🔴 Server:</strong> Persists to DB
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {paymentFlowError && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-700">
                          ❌ <strong>Error:</strong> {paymentFlowError}
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
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                        <span className="text-xs font-semibold text-green-700">🟢 Client</span>
                        <span className="text-xs text-gray-400">+</span>
                        <span className="text-xs font-semibold text-red-700">🔴 Server</span>
                      </div>
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

                      {/* Payment Details Summary */}
                      <div className="bg-primary-50 rounded-lg p-3">
                        <h4 className="text-primary-800 mb-2 text-sm font-semibold">Payment Summary</h4>
                        <div className="text-primary-600 space-y-1 text-xs">
                          <p>
                            <strong>Store ID:</strong> {storeId}
                          </p>
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

                      {/* Error Display */}
                      {paymentFlowError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                          <p className="text-sm">❌ {paymentFlowError}</p>
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
                        disabled={isLoading || !paymentAmount || !storeId.trim()}
                        className="bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
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
                      <div
                        className={`rounded-lg border p-3 ${
                          isScaRequired() ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="space-y-2 text-xs">
                          <p className={isScaRequired() ? 'text-orange-700' : 'text-blue-700'}>
                            <strong>{isScaRequired() ? '⚠️ SCA Required:' : 'ℹ️ 3DS Authentication:'}</strong>{' '}
                            {isScaRequired()
                              ? 'This card requires 3DS authentication. A secure modal will appear during payment.'
                              : 'If your payment requires 3DS verification, a secure modal will automatically appear.'}
                          </p>
                          {threedsSessionResult ? (
                            <p
                              className={`rounded p-2 ${
                                isScaRequired()
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              <strong>✅ 3DS Session Ready:</strong> Payment will use pre-created session for
                              faster processing.
                            </p>
                          ) : isScaRequired() ? (
                            <p className="rounded bg-orange-100 p-2 text-orange-700">
                              <strong>⚠️ Important:</strong> Create a 3DS session above before processing
                              payment (required by this card).
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
                        {threeDsStatus === 'failed' && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                            <div className="space-y-2">
                              <p className="text-sm text-red-700">
                                ❌ <strong>3DS Authentication Failed</strong>
                              </p>
                              <p className="text-xs text-red-600">
                                {paymentFlowError || 'The authentication challenge could not be completed'}
                              </p>
                              <button
                                onClick={retry3DSFromBeginning}
                                disabled={isLoading}
                                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                              >
                                {isLoading ? (
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
                                    Retrying from beginning...
                                  </span>
                                ) : (
                                  '🔄 Retry 3DS from Beginning'
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
                  {threeDsStatus === 'failed' && (
                    <button
                      onClick={retry3DSFromBeginning}
                      disabled={isLoading}
                      className="rounded-lg bg-yellow-600 px-6 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isLoading ? (
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
                          Retrying from beginning...
                        </span>
                      ) : (
                        '🔄 Retry 3DS from Beginning'
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
