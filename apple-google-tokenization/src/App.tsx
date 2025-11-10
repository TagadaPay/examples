import { useState } from 'react';
import { ApplePayButton } from './components/ApplePayButton';
import { GooglePayButton } from './components/GooglePayButton';
import { ErrorDisplay } from './components/ErrorDisplay';
import { TestingNotes } from './components/TestingNotes';
import type { ApplePayTokenResponse } from '../../../tagadapay-app/packages/core-js/src/core/types';

interface PaymentToken {
  type: 'applePay' | 'googlePay';
  tagadaToken?: string; // For Google Pay (core-js)
  token: ApplePayTokenResponse | Record<string, unknown>; // For Apple Pay or raw token
  details: Record<string, unknown>;
}

interface PaymentInstrumentResult {
  paymentInstrument: {
    id: string;
    type: string;
    card: {
      last4: string;
      brand: string;
      expMonth: number;
      expYear: number;
    };
  };
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

function App() {
  const [tokenResult, setTokenResult] = useState<PaymentToken | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentInstrumentResult, setPaymentInstrumentResult] = useState<PaymentInstrumentResult | null>(null);
  const [isCreatingInstrument, setIsCreatingInstrument] = useState(false);
  const [storeId, setStoreId] = useState('store_test_123');
  const [apiToken, setApiToken] = useState('');

  const handleApplePaySuccess = (_tokenId: string, tokenResponse: ApplePayTokenResponse, paymentData: Record<string, unknown>) => {
    setTokenResult({
      type: 'applePay',
      token: tokenResponse,
      details: paymentData,
    });
    setIsProcessing(false);
  };

  const handleGooglePaySuccess = (tagadaToken: string, rawToken: Record<string, unknown>, paymentData: Record<string, unknown>) => {
    setTokenResult({
      type: 'googlePay',
      tagadaToken, // TagadaToken from core-js
      token: rawToken, // Raw token for display
      details: paymentData, // Full Google Pay response
    });
    setIsProcessing(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleButtonClick = () => {
    setError('');
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setIsProcessing(true);
  };

  const createPaymentInstrument = async () => {
    if (!tokenResult || !apiToken.trim() || !storeId.trim()) {
      setError('Missing token, API token, or Store ID');
      return;
    }

    setIsCreatingInstrument(true);
    setError('');

    try {
      // Mock API call - replace with actual TagadaPay API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Mock successful response
      const mockResult: PaymentInstrumentResult = {
        paymentInstrument: {
          id: 'pi_' + Math.random().toString(36).substr(2, 9),
          type: tokenResult.type === 'applePay' ? 'apple_pay' : 'google_pay',
          card: {
            last4: '4242',
            brand: tokenResult.type === 'applePay' ? 'visa' : 'mastercard',
            expMonth: 12,
            expYear: 2025,
          },
        },
        customer: {
          id: 'cust_' + Math.random().toString(36).substr(2, 9),
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      
      setPaymentInstrumentResult(mockResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment instrument';
      setError(errorMessage);
    } finally {
      setIsCreatingInstrument(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const resetFlow = () => {
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setError('');
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Payment Tokenization Test
          </h1>
          <p className="text-slate-600">
            Test Apple Pay and Google Pay tokenization
          </p>
        </div>

        {/* Server Configuration */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">🔧 Server Configuration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store ID
              </label>
              <input
                type="text"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="store_test_123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Token
              </label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your API token"
              />
            </div>
          </div>
        </div>

        {/* Payment Flow */}
        {!tokenResult ? (
          /* Step 0 - Payment Selection */
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2">
                <span className="text-sm font-semibold text-blue-700">🟢 CLIENT-SIDE</span>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                💳 Step 1: Choose Payment Method
              </h3>
              <p className="text-gray-600">Select Apple Pay or Google Pay to tokenize payment data</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div onClick={handleButtonClick}>
                <ApplePayButton
                  onSuccess={handleApplePaySuccess}
                  onError={handleError}
                  disabled={isProcessing}
                />
              </div>
              <div onClick={handleButtonClick}>
                <GooglePayButton
                  onSuccess={handleGooglePaySuccess}
                  onError={handleError}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Payment Flow Steps */
          <div className="space-y-6">
            {/* Flow Overview */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-bold text-blue-900">
                  🔄 Payment Processing Flow
                </h3>
                <p className="text-sm text-blue-700">
                  {tokenResult.type === 'applePay' ? '🍎 Apple Pay' : '🟢 Google Pay'} tokenization completed
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">🟢 Client</span>
                  <span className="text-xs text-gray-400">+</span>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">🔴 Server</span>
                </div>
                <button
                  onClick={resetFlow}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  ↻ Start Over
                </button>
              </div>
            </div>

            {/* Step 1 - Token Display */}
            <div className="rounded-xl border border-green-200 bg-white p-6 shadow-lg">
              <div className="mb-4 text-center">
                <h3 className="mb-1 text-lg font-bold text-green-800">
                  🎯 Step 1: Secure Payment Token
                </h3>
                <p className="text-sm text-green-600">
                  {tokenResult.type === 'applePay' ? 'Apple Pay Token (ID)' : 'TagadaToken (Base64)'}
                </p>
              </div>

              <div className="relative">
                <div className="rounded-lg border border-green-200 bg-gray-900 p-4">
                  <code className="block break-all font-mono text-xs leading-relaxed text-green-400">
                    {tokenResult.type === 'applePay' 
                      ? (tokenResult.token as ApplePayTokenResponse).id
                      : tokenResult.tagadaToken || 'No TagadaToken available'
                    }
                  </code>
                </div>

                <button
                  onClick={() => copyToClipboard(
                    tokenResult.type === 'applePay' 
                      ? (tokenResult.token as ApplePayTokenResponse).id
                      : tokenResult.tagadaToken || ''
                  )}
                  className="absolute right-2 top-2 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white shadow transition-all duration-200 hover:bg-green-700"
                >
                  📋 Copy
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-green-600">
                  ✅ Token created successfully - Ready for Step 2
                </p>
              </div>
            </div>

            {/* Step 2 - API Configuration */}
            {!paymentInstrumentResult && (
              <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-lg">
                <div className="mb-4 text-center">
                  <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1">
                    <span className="text-xs font-semibold text-red-700">🔴 SERVER-SIDE</span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-orange-800">
                    🚀 Step 2: Create Payment Instrument
                  </h3>
                  <p className="text-sm text-orange-600">Send token to TagadaPay API</p>
                </div>

                <div className="space-y-4">
                  {/* Config Summary */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">Configuration</h4>
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
                    disabled={isCreatingInstrument || !apiToken.trim() || !storeId.trim()}
                    className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isCreatingInstrument ? (
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
                      <h4 className="mb-2 font-semibold text-gray-800">Payment Instrument</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>ID:</strong> {paymentInstrumentResult.paymentInstrument.id}
                        </p>
                        <p>
                          <strong>Type:</strong> {paymentInstrumentResult.paymentInstrument.type}
                        </p>
                        <p>
                          <strong>Card:</strong> **** **** **** {paymentInstrumentResult.paymentInstrument.card.last4}
                        </p>
                        <p>
                          <strong>Brand:</strong> {paymentInstrumentResult.paymentInstrument.card.brand}
                        </p>
                        <p>
                          <strong>Expires:</strong> {paymentInstrumentResult.paymentInstrument.card.expMonth}/{paymentInstrumentResult.paymentInstrument.card.expYear}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-800">Customer</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>ID:</strong> {paymentInstrumentResult.customer.id}
                        </p>
                        <p>
                          <strong>Email:</strong> {paymentInstrumentResult.customer.email}
                        </p>
                        <p>
                          <strong>Name:</strong> {paymentInstrumentResult.customer.firstName} {paymentInstrumentResult.customer.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <ErrorDisplay message={error} />}

        <TestingNotes />
      </div>
    </div>
  );
}

export default App;
