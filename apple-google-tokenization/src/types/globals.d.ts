// Global type declarations for payment APIs

// Google Pay API
declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new(options: { environment: string }) => {
            isReadyToPay(request: Record<string, unknown>): Promise<{ result: boolean }>;
            loadPaymentData(request: Record<string, unknown>): Promise<{
              paymentMethodData: {
                tokenizationData: {
                  token: string;
                };
              };
            }>;
          };
        };
      };
    };
    ApplePaySession?: unknown;
  }
}

export {};
