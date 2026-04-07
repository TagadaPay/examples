import { useState, useEffect, useRef } from 'react';
import { apiRequest, type PaymentResult } from '@/lib/api';

const TERMINAL_STATUSES = new Set(['succeeded', 'declined', 'failed', 'refunded', 'cancelled']);
const MAX_POLLS = 60; // 2 minutes max

interface UsePaymentPollingParams {
  paymentId: string;
  apiBaseUrl: string;
  apiToken: string;
}

interface UsePaymentPollingReturn {
  payment: PaymentResult | null;
  isPolling: boolean;
  pollCount: number;
  error: string | null;
}

export function usePaymentPolling({
  paymentId,
  apiBaseUrl,
  apiToken,
}: UsePaymentPollingParams): UsePaymentPollingReturn {
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    if (!paymentId || !apiBaseUrl || !apiToken) {
      setError('Missing payment configuration — API token and base URL are required.');
      setIsPolling(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await apiRequest<PaymentResult>({
          method: 'GET',
          path: `/api/public/v1/payments/${paymentId}`,
          apiBaseUrl,
          apiToken,
        });

        if (!res.ok) {
          setError(`Failed to fetch payment (HTTP ${res.status})`);
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        const data = res.data;
        // Normalise: GET endpoint may return flat payment or wrapped
        const normalised: PaymentResult = (data as { payment?: unknown }).payment
          ? (data as unknown as PaymentResult)
          : { payment: (data as unknown) as PaymentResult['payment'] } as PaymentResult;

        setPayment(normalised);
        countRef.current += 1;
        setPollCount(countRef.current);

        const status = normalised.payment?.status;
        if (TERMINAL_STATUSES.has(status) || countRef.current >= MAX_POLLS) {
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error while polling');
        setIsPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paymentId, apiBaseUrl, apiToken]);

  return { payment, isPolling, pollCount, error };
}
