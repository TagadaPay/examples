export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  apiBaseUrl: string;
  apiToken: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  duration: number;
  headers: Record<string, string>;
}

export async function apiRequest<T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { method, path, body, apiBaseUrl, apiToken } = options;
  const url = `${apiBaseUrl}${path}`;
  const start = performance.now();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const duration = Math.round(performance.now() - start);
  const rawText = await response.text();

  let data: T;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText as unknown as T;
  }

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return { ok: response.ok, status: response.status, data, duration, headers };
}

export interface PaymentInstrumentResult {
  paymentInstrument: {
    id: string;
    type: string;
    customerId: string;
    accountId: string;
    isActive: boolean;
    isDefault: boolean;
    tokenizer: string;
    createdAt: string;
    card: {
      last4: string;
      brand: string;
      expYear: number;
      expMonth: number;
    };
  };
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };
}

export interface PaymentResult {
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    subStatus?: string;
    requireAction?: string;
    requireActionData?: {
      type?: string;
      metadata?: {
        provider?: string;
        isTest?: boolean;
        threedsSession?: {
          acsChallengeUrl?: string;
          externalSessionId?: string;
        };
        acsChallengeUrl?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    createdAt: string;
    [key: string]: unknown;
  };
  transactions?: Record<string, unknown>[];
  [key: string]: unknown;
}
