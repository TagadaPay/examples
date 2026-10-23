import type { PaymentToken, PaymentInstrumentResult, ServerConfig } from '../types';

/**
 * Create payment instrument parameters for TagadaPay API
 */
interface CreatePaymentInstrumentParams {
  tagadaToken: string;
  storeId: string;
  customerData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Real API call to create payment instrument via TagadaPay
 * Based on core-js-tokenization example implementation
 */
export async function createPaymentInstrument(
  token: PaymentToken,
  config: ServerConfig & { apiBaseUrl?: string }
): Promise<PaymentInstrumentResult> {
  // Validate inputs
  if (!token || !config.apiToken.trim() || !config.storeId.trim()) {
    throw new Error('Missing token, API token, or Store ID');
  }

  // Extract the tagada token based on payment type
  const tagadaToken: string = token.tagadaToken || '';


  if (!tagadaToken) {
    throw new Error('No valid token found for payment instrument creation');
  }

  // Prepare API parameters
  const params: CreatePaymentInstrumentParams = {
    tagadaToken,
    storeId: config.storeId,
    customerData: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  // Make real API call to TagadaPay
  const apiBaseUrl = config.apiBaseUrl || 'https://app.tagadapay.com';
  const response = await fetch(`${apiBaseUrl}/api/public/v1/payment-instruments/create-from-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to create payment instrument: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    throw new Error('Failed to copy to clipboard');
  }
}
