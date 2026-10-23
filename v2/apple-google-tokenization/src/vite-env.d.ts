/// <reference types="vite/client" />

declare global {
  interface Window {
    ApplePaySession?: any;
  }

  const google: {
    payments: {
      api: {
        PaymentsClient: new (options: { environment: string }) => {
          isReadyToPay: (request: any) => Promise<{ result: boolean }>;
          loadPaymentData: (request: any) => Promise<any>;
        };
      };
    };
  };

  const ApplePaySession: any;
}

export {};
