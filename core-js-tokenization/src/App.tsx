import { useState } from 'react';
import { CardForm } from './components/CardForm';
import type { TagadaToken } from './components/CardForm';
import type { CardTokenResponse } from '@tagadapay/core-js/react';
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
    requireAction: string;
    createdAt: string;
  };
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

  const handleTokenized = (tagadaToken: string, originalToken: CardTokenResponse) => {
    // Decode the TagadaToken for display purposes
    const decodedTagadaToken = JSON.parse(atob(tagadaToken)) as TagadaToken;

    setTokenResult({
      tagadaToken,
      originalToken,
      decodedTagadaToken,
    });
  };

  const resetToken = () => {
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setPaymentResult(null);
    setApiError(null);
  };

  const copyToClipboard = async () => {
    if (tokenResult) {
      await navigator.clipboard.writeText(tokenResult.tagadaToken);
      // You could add a toast notification here
    }
  };

  const createPaymentInstrument = async () => {
    if (!tokenResult || !apiToken.trim()) {
      setApiError('Please provide an API token');
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
    } catch (error) {
      console.error('Error creating payment instrument:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to create payment instrument');
    } finally {
      setIsCreatingPaymentInstrument(false);
    }
  };

  const processPayment = async () => {
    if (!paymentInstrumentResult || !apiToken.trim()) {
      setApiError('Payment instrument and API token are required');
      return;
    }

    setIsProcessingPayment(true);
    setApiError(null);

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PaymentResult = await response.json();
      setPaymentResult(result);
    } catch (error) {
      console.error('Error processing payment:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="from-primary-50 via-accent-50 to-primary-100 flex min-h-screen flex-col bg-gradient-to-br">
      {/* Compact Header */}
      <header className="border-primary-200/50 border-b bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="text-center">
            <h1 className="from-primary-800 to-accent-700 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
              TagadaPay Card Tokenization
            </h1>
            <p className="text-primary-600 mx-auto mt-2 max-w-xl text-sm">
              Complete payment demo: Tokenize → Create Payment Instrument → Process Payment with{' '}
              <code className="bg-primary-100 text-primary-700 rounded px-1 py-0.5 font-mono text-xs">
                @tagadapay/core-js
              </code>
            </p>
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
                      paymentResult ? 'bg-accent-600' : 'bg-primary-300'
                    }`}
                  >
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <span className="text-primary-700 ml-2 text-xs font-medium">Process Payment</span>
                </div>
              </div>

              {/* Step 1 - Token Display */}
              <div className="border-primary-200 rounded-xl border bg-white p-6 shadow-lg">
                <div className="mb-4 text-center">
                  <h3 className="text-primary-800 mb-1 text-lg font-bold">🎯 Step 1: Secure Payment Token</h3>
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
                  <p className="text-primary-600 text-xs">✅ Token created successfully - Ready for Step 2</p>
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
                      <label htmlFor="apiToken" className="text-primary-700 mb-1 block text-xs font-semibold">
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

                    {/* Create Button */}
                    <button
                      onClick={createPaymentInstrument}
                      disabled={isCreatingPaymentInstrument || !apiToken.trim()}
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
                    <h3 className="mb-1 text-lg font-bold text-green-800">🎉 Payment Instrument Created!</h3>
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
                </div>
              )}

              {/* Step 3 - Payment Processing */}
              {paymentInstrumentResult && !paymentResult && (
                <div className="border-primary-200 rounded-xl border bg-white p-6 shadow-lg">
                  <div className="mb-4 text-center">
                    <h3 className="text-primary-800 mb-1 text-lg font-bold">
                      💳 Step 3: Process Demo Payment
                    </h3>
                    <p className="text-primary-600 text-sm">Test the complete payment flow</p>
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
                      <label htmlFor="storeId" className="text-primary-700 mb-1 block text-xs font-semibold">
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

                    {/* Process Payment Button */}
                    <button
                      onClick={processPayment}
                      disabled={isProcessingPayment || !paymentAmount || !storeId.trim()}
                      className="bg-accent-600 hover:bg-accent-700 disabled:bg-primary-300 w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
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
                          Processing Payment...
                        </span>
                      ) : (
                        '💳 Process Demo Payment'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 - Payment Success Result */}
              {paymentResult && (
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-green-800">
                      🎉 Payment Processed Successfully!
                    </h3>
                    <p className="text-sm text-green-600">Complete payment flow demonstration</p>
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
                            <span className="font-medium text-green-600">{paymentResult.payment.status}</span>
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
                            <strong>Action Required:</strong> {paymentResult.payment.requireAction}
                          </p>
                          <p>
                            <strong>Card:</strong> **** **** ****{' '}
                            {paymentInstrumentResult?.paymentInstrument.card.last4}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="text-center">
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
  );
}

export default App;
