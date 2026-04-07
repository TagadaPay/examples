import { useState, useCallback } from 'react';

export interface LogItem {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'event' | 'error';
  title: string;
  subtitle?: string;
  duration?: number;
  status?: number;
  data?: unknown;
}

export interface PaymentLogger {
  logs: LogItem[];
  clear: () => void;
  request: (title: string, data?: unknown) => void;
  response: (title: string, data?: unknown, duration?: number, status?: number) => void;
  event: (title: string, data?: unknown) => void;
  error: (title: string, data?: unknown) => void;
}

export function usePaymentLogger(): PaymentLogger {
  const [logs, setLogs] = useState<LogItem[]>([]);

  const push = useCallback((entry: Omit<LogItem, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  return {
    logs,
    clear: useCallback(() => setLogs([]), []),
    request:  useCallback((title, data?) => push({ type: 'request', title, data }), [push]),
    response: useCallback((title, data?, duration?, status?) => push({ type: 'response', title, data, duration, status }), [push]),
    event:    useCallback((title, data?) => push({ type: 'event', title, data }), [push]),
    error:    useCallback((title, data?) => push({ type: 'error', title, data }), [push]),
  };
}
