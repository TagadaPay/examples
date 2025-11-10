import { useCardTokenization } from '@tagadapay/core-js/react';
import { useState, useEffect } from 'react';

// Apple Pay types
interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: {
    label: string;
    amount: string;
  };
  requiredBillingContactFields?: string[];
}

interface ApplePayValidateMerchantEvent {
  validationURL: string;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: {
    token: Record<string, unknown>;
    billingContact?: Record<string, unknown>;
    shippingContact?: Record<string, unknown>;
  };
}

interface ApplePaySessionErrorEvent {
  message?: string;
}

// Extend Window interface for Apple Pay
declare global {
  interface Window {
    ApplePaySession?: typeof ApplePaySession;
  }
}

declare const ApplePaySession: {
  new(version: number, request: ApplePayPaymentRequest): {
    begin(): void;
    abort(): void;
    onerror: ((event: ApplePaySessionErrorEvent) => void) | null;
    completeMerchantValidation(merchantSession: Record<string, unknown>): void;
    completePayment(status: number): void;
    onvalidatemerchant: ((event: ApplePayValidateMerchantEvent) => void) | null;
    onpaymentauthorized: ((event: ApplePayPaymentAuthorizedEvent) => void) | null;
    oncancel: (() => void) | null;
  };
  STATUS_SUCCESS: number;
  STATUS_FAILURE: number;
  canMakePayments(): boolean;
}

// Import the actual ApplePayTokenResponse from core-js
import type { ApplePayTokenResponse as CoreApplePayTokenResponse } from '@tagadapay/core-js';

// Use the core-js type
type ApplePayTokenResponse = CoreApplePayTokenResponse;

interface ApplePayButtonProps {
  onSuccess: (tokenId: string, tokenResponse: ApplePayTokenResponse, paymentData: Record<string, unknown>) => void;
  onError: (error: string) => void;
  disabled: boolean;
}


export function ApplePayButton({ onSuccess, onError, disabled }: ApplePayButtonProps) {
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [applePayLoaded, setApplePayLoaded] = useState<boolean>(false);
  const [applePayAvailable, setApplePayAvailable] = useState<boolean>(false);
  
  const { tokenizeApplePay, validateApplePayMerchant, isLoading, error } = useCardTokenization({
    environment: 'development', // Use test environment
    autoInitialize: true,
  });

  // Load Apple Pay JS SDK dynamically
  useEffect(() => {
    const loadApplePaySDK = async () => {
      // Check if Apple Pay is already loaded
      if (window.ApplePaySession) {
        setApplePayLoaded(true);
        setApplePayAvailable(ApplePaySession.canMakePayments());
        return;
      }

      try {
        // Create and load the Apple Pay SDK script
        const script = document.createElement('script');
        script.src = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
        script.crossOrigin = 'anonymous';
        script.async = true;

        // Wait for script to load
        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Apple Pay SDK loaded successfully');
            resolve();
          };
          script.onerror = () => {
            console.error('❌ Failed to load Apple Pay SDK');
            reject(new Error('Failed to load Apple Pay SDK'));
          };
          document.head.appendChild(script);
        });

        // Check availability after loading
        if (window.ApplePaySession && ApplePaySession.canMakePayments) {
          setApplePayLoaded(true);
          setApplePayAvailable(ApplePaySession.canMakePayments());
        } else {
          setApplePayLoaded(true);
          setApplePayAvailable(false);
        }
      } catch (error) {
        console.error('Error loading Apple Pay SDK:', error);
        setApplePayLoaded(true);
        setApplePayAvailable(false);
      }
    };

    loadApplePaySDK();
  }, []);

  const handleApplePay = async () => {
    try {
      if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
        throw new Error('Apple Pay is not available on this device/browser');
      }

      const request = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'Test Payment',
          amount: '10.00',
          type: 'final',
        },
        requiredBillingContactFields: ['postalAddress'],
      };

      const session = new ApplePaySession(3, request);

      session.onvalidatemerchant = (event: ApplePayValidateMerchantEvent) => {
        void (async () => {
          try {
            console.log('Merchant validation requested for:', event.validationURL);
            const merchantSession = await validateApplePayMerchant('Test Store', window.location.host);
            session.completeMerchantValidation(merchantSession);
          } catch (error) {
            console.error('Merchant validation failed:', error);
            onError('Merchant validation failed');
            session.abort();
          }
        })();
      };

      session.onpaymentauthorized = (event: ApplePayPaymentAuthorizedEvent) => {
        void (async () => {
          try {
            setProcessingPayment(true);
            console.log('Apple Pay Token:', event.payment.token);

            // Use core-js to tokenize Apple Pay
            const tokenResponse = await tokenizeApplePay(event.payment.token as never);


            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            onSuccess(tokenResponse.id, tokenResponse, event.payment);
          } catch (error) {
            console.error('Payment processing failed:', error);
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            onError('Payment processing failed');
          } finally {
            setProcessingPayment(false);
          }
        })();
      };

      session.oncancel = () => {
        console.log('Payment cancelled by user');
        onError('Payment cancelled');
      };

      session.onerror = (event: ApplePaySessionErrorEvent) => {
        console.error('Apple Pay Session Error:', event);
        onError('Apple Pay session error');
      };

      session.begin();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Apple Pay error';
      onError(errorMessage);
    }
  };

  // Show error from core-js if any
  if (error) {
    onError(error);
  }

  const loadingButton = processingPayment || isLoading || disabled || !applePayLoaded;
  
  // Don't render if Apple Pay failed to load
  if (applePayLoaded && !applePayAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleApplePay}
      disabled={loadingButton || !applePayAvailable}
      className="bg-black hover:bg-slate-800 text-white font-semibold py-6 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {!applePayLoaded ? (
        <>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-lg">Loading Apple Pay SDK...</span>
        </>
      ) : processingPayment || isLoading ? (
        <>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-lg">Processing...</span>
        </>
      ) : (
        <>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span className="text-lg">Test Apple Pay with Core-JS</span>
        </>
      )}
    </button>
  );
}
