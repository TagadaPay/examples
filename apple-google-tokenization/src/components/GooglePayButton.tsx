import { useCardTokenization } from '@tagadapay/core-js/react';
import { getGoogleTenantId  } from '@tagadapay/core-js/core';

interface GooglePayButtonProps {
  onSuccess: (tagadaToken: string, rawToken: Record<string, unknown>, paymentData: Record<string, unknown>) => void;
  onError: (error: string) => void;
  disabled: boolean;
}

// Google Pay will be available via global types

export function GooglePayButton({ onSuccess, onError, disabled }: GooglePayButtonProps) {
  const { tokenizeGooglePay, isLoading, error } = useCardTokenization({
    environment: 'development', // Use test environment
    autoInitialize: true,
  });

  const handleGooglePay = async () => {
    try {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST',
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'basistheory',
                gatewayMerchantId: getGoogleTenantId('development'),
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: '12345678901234567890',
          merchantName: 'Test Merchant',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: '10.00',
          currencyCode: 'USD',
          countryCode: 'US',
        },
      };

      const isReadyToPay = await paymentsClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: paymentDataRequest.allowedPaymentMethods,
      });

      if (!isReadyToPay.result) {
        throw new Error('Google Pay is not available on this device/browser');
      }

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      // Extract Google Pay token from payment data
      const googlePayTokenString = paymentData.paymentMethodData.tokenizationData.token;
      const googlePayToken = JSON.parse(googlePayTokenString);

      console.log('Google Pay Token:', googlePayToken);

      // Use core-js to tokenize Google Pay
      const { tagadaToken, rawToken } = await tokenizeGooglePay(googlePayToken);

      console.log('TagadaToken:', tagadaToken);
      console.log('Raw Token:', rawToken);

      onSuccess(tagadaToken, rawToken as unknown as Record<string, unknown>, paymentData as unknown as Record<string, unknown>);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google Pay error';
      onError(errorMessage);
    }
  };

  // Show error from core-js if any
  if (error) {
    onError(error);
  }

  return (
    <button
      onClick={handleGooglePay}
      disabled={disabled || isLoading}
      className="bg-white hover:bg-slate-50 text-slate-900 font-semibold py-6 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {isLoading ? (
        <>
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <span className="text-lg">Processing...</span>
        </>
      ) : (
        <>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.993 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
            <path d="M12.24 4.426c2.33 0 3.891.993 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0 7.46 0 3.386 2.838 1.357 6.879l3.772 2.93c.884-2.638 3.343-4.383 6.111-4.383z" fill="#EA4335"/>
            <path d="M12.24 19.574c-2.758 0-5.217-1.736-6.111-4.365l-3.772 2.93C4.386 21.162 7.46 24 12.24 24c3.115 0 5.79-1.115 7.721-3.021l-3.563-2.769c-.978.655-2.221 1.064-3.658 1.064" fill="#34A853"/>
            <path d="M23.76 12c0-.788-.085-1.39-.189-1.989H12.24v4.274h6.517c-.275 1.449-1.103 2.674-2.353 3.495l3.563 2.769c2.073-1.913 3.793-4.729 3.793-8.549z" fill="#FBBC05"/>
          </svg>
          <span className="text-lg">Test Google Pay with Core-JS</span>
        </>
      )}
    </button>
  );
}
