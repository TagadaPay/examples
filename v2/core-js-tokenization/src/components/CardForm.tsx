import { useState } from 'react';
import { useCardTokenization } from '@tagadapay/core-js/react';
import type { CardPaymentMethod, CardTokenResponse } from '@tagadapay/core-js/react';
import type { TagadaToken } from '@tagadapay/core-js';

// Re-export TagadaToken type for convenience
export type { TagadaToken };

interface CardFormProps {
  onTokenized?: (tagadaToken: string, originalToken: CardTokenResponse) => void;
}

export function CardForm({ onTokenized }: CardFormProps) {
  const [cardData, setCardData] = useState<CardPaymentMethod>({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  });

  const { tokenizeCard, isLoading, error, clearError, isInitialized } = useCardTokenization({
    environment: 'production',
    autoInitialize: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      // Tokenize card - returns both TagadaToken (for backend) and raw token (for UI)
      const result = await tokenizeCard(cardData);
      console.log('Card tokenized successfully');
      console.log('- TagadaToken (for backend):', result.tagadaToken);
      console.log('- Raw token (for UI):', result.rawToken);

      // Pass to parent component
      onTokenized?.(result.tagadaToken, result.rawToken);
    } catch (error) {
      console.error('Tokenization failed:', error);
    }
  };

  const handleInputChange = (field: keyof CardPaymentMethod) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }

    // Format expiry date
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
    }

    // Format CVC (numbers only)
    if (field === 'cvc') {
      value = value.replace(/\D/g, '');
    }

    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (field: keyof CardPaymentMethod, value: string): string | null => {
    switch (field) {
      case 'cardNumber':
        const cleanNumber = value.replace(/\s+/g, '');
        if (!cleanNumber) return 'Card number is required';
        if (cleanNumber.length < 13 || cleanNumber.length > 19) return 'Invalid card number length';
        if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
        return null;
      case 'expiryDate':
        if (!value) return 'Expiry date is required';
        if (!/^\d{2}\/\d{2}$/.test(value)) return 'Format: MM/YY';
        const [month, year] = value.split('/').map(Number);
        if (month < 1 || month > 12) return 'Invalid month';
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return 'Card has expired';
        }
        return null;
      case 'cvc':
        if (!value) return 'CVC is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVC must be 3-4 digits';
        return null;
      case 'cardholderName':
        if (!value.trim()) return 'Cardholder name is required';
        if (value.trim().length < 2) return 'Name too short';
        return null;
      default:
        return null;
    }
  };

  const getCardType = (cardNumber: string): string => {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    return 'unknown';
  };

  const cardType = getCardType(cardData.cardNumber);

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Card Preview */}
      <div className="perspective-1000 mb-6">
        <div className="transform-style-preserve-3d relative h-40 w-full transition-transform duration-700">
          <div className="from-primary-800 via-primary-700 to-accent-800 absolute inset-0 rounded-xl bg-gradient-to-br p-4 text-white shadow-xl">
            {/* Card Background Pattern */}
            <div className="from-accent-600/20 to-primary-600/20 absolute inset-0 rounded-xl bg-gradient-to-br"></div>
            <div className="from-accent-400 to-accent-600 absolute right-3 top-3 h-8 w-8 rounded-full bg-gradient-to-br opacity-80"></div>
            <div className="from-primary-400 to-primary-600 absolute right-8 top-4 h-6 w-6 rounded-full bg-gradient-to-br opacity-60"></div>

            {/* Card Content */}
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium opacity-80">TAGADAPAY</div>
                <div className="text-xs opacity-60">SECURE TOKEN</div>
              </div>

              <div className="space-y-3">
                <div className="font-mono text-base tracking-wider">
                  {cardData.cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs opacity-70">CARDHOLDER</div>
                    <div className="text-xs font-medium">{cardData.cardholderName || 'YOUR NAME'}</div>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <div className="text-xs opacity-70">EXPIRES</div>
                    <div className="text-xs font-medium">{cardData.expiryDate || 'MM/YY'}</div>
                  </div>

                  <div className="ml-3">
                    {cardType === 'visa' && <div className="text-lg font-bold opacity-90">VISA</div>}
                    {cardType === 'mastercard' && (
                      <div className="flex space-x-1">
                        <div className="h-4 w-4 rounded-full bg-red-500"></div>
                        <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                      </div>
                    )}
                    {cardType === 'amex' && <div className="text-sm font-bold opacity-90">AMEX</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <div className="border-primary-200 overflow-hidden rounded-xl border bg-white shadow-lg">
        <div className="from-primary-700 to-accent-700 bg-gradient-to-r px-6 py-4">
          <div className="text-center">
            <h2 className="mb-1 text-lg font-bold text-white">💳 Card Information</h2>
            <p className="text-primary-100 text-sm">Enter your details to generate a secure token</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Cardholder Name */}
          <div className="group">
            <label
              htmlFor="cardholderName"
              className="text-primary-700 mb-1 flex items-center text-xs font-semibold"
            >
              <svg
                className="mr-2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Cardholder Name
            </label>
            <div className="relative">
              <input
                id="cardholderName"
                type="text"
                placeholder="John Doe"
                value={cardData.cardholderName}
                onChange={handleInputChange('cardholderName')}
                onFocus={() => setFocusedField('cardholderName')}
                onBlur={() => {
                  setFocusedField(null);
                  const error = validateField('cardholderName', cardData.cardholderName || '');
                  setValidationErrors((prev) => ({ ...prev, cardholderName: error || '' }));
                }}
                className={`text-primary-900 placeholder-primary-400 w-full rounded-xl border-2 px-4 py-4 text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-4 ${
                  validationErrors.cardholderName
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                    : focusedField === 'cardholderName'
                      ? 'border-accent-500 bg-accent-50 focus:border-accent-600 focus:ring-accent-100'
                      : 'border-primary-200 bg-primary-50 hover:border-primary-300 hover:bg-white focus:bg-white'
                }`}
              />
              {focusedField === 'cardholderName' && (
                <div className="absolute right-3 top-3">
                  <div className="bg-accent-500 h-2 w-2 animate-pulse rounded-full"></div>
                </div>
              )}
            </div>
            {validationErrors.cardholderName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cardholderName}</p>
            )}
          </div>

          {/* Card Number */}
          <div className="group">
            <label
              htmlFor="cardNumber"
              className="mb-2 flex items-center text-sm font-semibold text-gray-700"
            >
              <svg
                className="mr-2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Card Number
            </label>
            <div className="relative">
              <input
                id="cardNumber"
                type="text"
                placeholder="4111 1111 1111 1111"
                value={cardData.cardNumber}
                onChange={handleInputChange('cardNumber')}
                onFocus={() => setFocusedField('cardNumber')}
                onBlur={() => {
                  setFocusedField(null);
                  const error = validateField('cardNumber', cardData.cardNumber);
                  setValidationErrors((prev) => ({ ...prev, cardNumber: error || '' }));
                }}
                maxLength={19}
                required
                className={`w-full rounded-xl border-2 px-4 py-4 font-mono text-lg font-medium text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-4 ${
                  validationErrors.cardNumber
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                    : focusedField === 'cardNumber'
                      ? 'border-tagada-500 bg-tagada-50 focus:border-tagada-600 focus:ring-tagada-100'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:bg-white'
                }`}
              />
              {cardType !== 'unknown' && (
                <div className="absolute right-3 top-3">
                  {cardType === 'visa' && (
                    <div className="rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white">VISA</div>
                  )}
                  {cardType === 'mastercard' && (
                    <div className="flex space-x-1">
                      <div className="h-4 w-4 rounded-full bg-red-500"></div>
                      <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                    </div>
                  )}
                  {cardType === 'amex' && (
                    <div className="rounded bg-blue-800 px-2 py-1 text-xs font-bold text-white">AMEX</div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cardNumber}</p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label
                htmlFor="expiryDate"
                className="mb-2 flex items-center text-sm font-semibold text-gray-700"
              >
                <svg
                  className="mr-2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Expiry Date
              </label>
              <div className="relative">
                <input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={handleInputChange('expiryDate')}
                  onFocus={() => setFocusedField('expiryDate')}
                  onBlur={() => {
                    setFocusedField(null);
                    const error = validateField('expiryDate', cardData.expiryDate);
                    setValidationErrors((prev) => ({ ...prev, expiryDate: error || '' }));
                  }}
                  maxLength={5}
                  required
                  className={`w-full rounded-xl border-2 px-4 py-4 font-mono text-lg font-medium text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-4 ${
                    validationErrors.expiryDate
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : focusedField === 'expiryDate'
                        ? 'border-tagada-500 bg-tagada-50 focus:border-tagada-600 focus:ring-tagada-100'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:bg-white'
                  }`}
                />
              </div>
              {validationErrors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.expiryDate}</p>
              )}
            </div>
            <div className="group">
              <label htmlFor="cvc" className="mb-2 flex items-center text-sm font-semibold text-gray-700">
                <svg
                  className="mr-2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                CVC
              </label>
              <div className="relative">
                <input
                  id="cvc"
                  type="text"
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={handleInputChange('cvc')}
                  onFocus={() => setFocusedField('cvc')}
                  onBlur={() => {
                    setFocusedField(null);
                    const error = validateField('cvc', cardData.cvc);
                    setValidationErrors((prev) => ({ ...prev, cvc: error || '' }));
                  }}
                  maxLength={4}
                  required
                  className={`w-full rounded-xl border-2 px-4 py-4 font-mono text-lg font-medium text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-4 ${
                    validationErrors.cvc
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : focusedField === 'cvc'
                        ? 'border-tagada-500 bg-tagada-50 focus:border-tagada-600 focus:ring-tagada-100'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:bg-white'
                  }`}
                />
              </div>
              {validationErrors.cvc && <p className="mt-1 text-sm text-red-600">{validationErrors.cvc}</p>}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form Validation Summary */}
          {Object.values(validationErrors).some((error) => error) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="font-medium text-amber-800">Please correct the errors above to continue</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isInitialized || Object.values(validationErrors).some((error) => error)}
            className="from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 group relative w-full overflow-hidden rounded-lg bg-gradient-to-r px-6 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:hover:scale-100"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>

            <div className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Tokenizing...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Tokenize Card Securely</span>
                </>
              )}
            </div>
          </button>

          {/* Initialization Status */}
          {!isInitialized && (
            <div className="text-center">
              <div className="inline-flex items-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
                <svg
                  className="-ml-1 mr-3 h-4 w-4 animate-spin text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium text-yellow-800">Initializing payment processor...</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Test Card Information */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">🧪 Test Card Numbers</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <div className="font-semibold text-blue-900">Visa</div>
            <div className="font-mono text-sm text-blue-700">4111 1111 1111 1111</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <div className="font-semibold text-blue-900">Mastercard</div>
            <div className="font-mono text-sm text-blue-700">5555 5555 5555 4444</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <div className="font-semibold text-blue-900">Amex</div>
            <div className="font-mono text-sm text-blue-700">3782 822463 10005</div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-blue-700">
          <strong>Note:</strong> Use any future expiry date (e.g., 12/25) and any 3-4 digit CVC.
        </p>
      </div>
    </div>
  );
}
