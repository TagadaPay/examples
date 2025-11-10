import { ApplePayButton } from './ApplePayButton';
import { GooglePayButton } from './GooglePayButton';
import type { ApplePayTokenResponse } from '@tagadapay/core-js';

interface PaymentMethodSelectorProps {
  isProcessing: boolean;
  onApplePaySuccess: (tokenId: string, tokenResponse: ApplePayTokenResponse, paymentData: Record<string, unknown>) => void;
  onGooglePaySuccess: (tagadaToken: string, rawToken: Record<string, unknown>, paymentData: Record<string, unknown>) => void;
  onError: (error: string) => void;
  onStartProcessing: () => void;
}

export function PaymentMethodSelector({
  isProcessing,
  onApplePaySuccess,
  onGooglePaySuccess,
  onError,
  onStartProcessing
}: PaymentMethodSelectorProps) {
  return (
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
        <div onClick={onStartProcessing}>
          <ApplePayButton
            onSuccess={onApplePaySuccess}
            onError={onError}
            disabled={isProcessing}
          />
        </div>
        <div onClick={onStartProcessing}>
          <GooglePayButton
            onSuccess={onGooglePaySuccess}
            onError={onError}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
