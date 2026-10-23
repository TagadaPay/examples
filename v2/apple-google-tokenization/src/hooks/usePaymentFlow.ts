import { useState } from 'react';
import type { PaymentToken, PaymentInstrumentResult, ServerConfig } from '../types';
import type { ApplePayTokenResponse } from '@tagadapay/core-js';
import { createPaymentInstrument, copyToClipboard } from '../utils/api';

export function usePaymentFlow() {
  const [tokenResult, setTokenResult] = useState<PaymentToken | null>(null);
  const [paymentInstrumentResult, setPaymentInstrumentResult] = useState<PaymentInstrumentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingInstrument, setIsCreatingInstrument] = useState(false);
  
  const [config, setConfig] = useState<ServerConfig>({
    storeId: 'store_test_123',
    apiToken: ''
  });

  const handleApplePaySuccess = (
    _tokenId: string, 
    tokenResponse: ApplePayTokenResponse, 
    paymentData: Record<string, unknown>
  ) => {
    setTokenResult({
      type: 'applePay',
      token: tokenResponse,
      details: paymentData,
    });
    setIsProcessing(false);
  };

  const handleGooglePaySuccess = (
    tagadaToken: string, 
    rawToken: Record<string, unknown>, 
    paymentData: Record<string, unknown>
  ) => {
    setTokenResult({
      type: 'googlePay',
      tagadaToken,
      token: rawToken,
      details: paymentData,
    });
    setIsProcessing(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleStartProcessing = () => {
    setError('');
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setIsProcessing(true);
  };

  const handleCreatePaymentInstrument = async () => {
    if (!tokenResult) {
      setError('No token available');
      return;
    }

    setIsCreatingInstrument(true);
    setError('');

    try {
      const result = await createPaymentInstrument(tokenResult, config);
      setPaymentInstrumentResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment instrument';
      setError(errorMessage);
    } finally {
      setIsCreatingInstrument(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await copyToClipboard(text);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const resetFlow = () => {
    setTokenResult(null);
    setPaymentInstrumentResult(null);
    setError('');
    setIsProcessing(false);
  };

  return {
    // State
    tokenResult,
    paymentInstrumentResult,
    error,
    isProcessing,
    isCreatingInstrument,
    config,
    
    // Actions
    setConfig,
    handleApplePaySuccess,
    handleGooglePaySuccess,
    handleError,
    handleStartProcessing,
    handleCreatePaymentInstrument,
    handleCopyToClipboard,
    resetFlow,
  };
}
