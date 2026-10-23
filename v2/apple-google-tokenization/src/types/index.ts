// Centralized type definitions for the Apple Pay/Google Pay example

import type { ApplePayTokenResponse } from '@tagadapay/core-js';

export interface PaymentToken {
  type: 'applePay' | 'googlePay';
  tagadaToken?: string; // For Google Pay (core-js)
  token: ApplePayTokenResponse | Record<string, unknown>; // For Apple Pay or raw token
  details: Record<string, unknown>;
}

export interface PaymentInstrumentResult {
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

export interface ServerConfig {
  storeId: string;
  apiToken: string;
}

export interface AppState {
  tokenResult: PaymentToken | null;
  paymentInstrumentResult: PaymentInstrumentResult | null;
  error: string;
  isProcessing: boolean;
  isCreatingInstrument: boolean;
  config: ServerConfig;
}
