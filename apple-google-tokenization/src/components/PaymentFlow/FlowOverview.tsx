import type { PaymentToken } from '../../types';

interface FlowOverviewProps {
  tokenResult: PaymentToken;
  onReset: () => void;
}

export function FlowOverview({ tokenResult, onReset }: FlowOverviewProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-bold text-blue-900">
          🔄 Payment Processing Flow
        </h3>
        <p className="text-sm text-blue-700">
          {tokenResult.type === 'applePay' ? '🍎 Apple Pay' : '🟢 Google Pay'} tokenization completed
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">🟢 Client</span>
          <span className="text-xs text-gray-400">+</span>
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">🔴 Server</span>
        </div>
        <button
          onClick={onReset}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          ↻ Start Over
        </button>
      </div>
    </div>
  );
}
