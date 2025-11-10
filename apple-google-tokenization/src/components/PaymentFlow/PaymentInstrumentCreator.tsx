import type { ServerConfig } from '../../types';

interface PaymentInstrumentCreatorProps {
  config: ServerConfig;
  isCreating: boolean;
  onCreatePaymentInstrument: () => void;
}

export function PaymentInstrumentCreator({ 
  config, 
  isCreating, 
  onCreatePaymentInstrument 
}: PaymentInstrumentCreatorProps) {
  return (
    <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-lg">
      <div className="mb-4 text-center">
        <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1">
          <span className="text-xs font-semibold text-red-700">🔴 SERVER-SIDE</span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-orange-800">
          🚀 Step 2: Create Payment Instrument
        </h3>
        <p className="text-sm text-orange-600">Send token to TagadaPay API</p>
      </div>

      <div className="space-y-4">
        {/* Config Summary */}
        <div className="rounded-lg bg-gray-50 p-3">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Configuration</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <strong>Store ID:</strong> {config.storeId || 'Not set'}
            </p>
            <p>
              <strong>API Token:</strong> {config.apiToken ? '••••••••' : 'Not set'}
            </p>
            <p className="text-xs text-gray-500">
              (Configure in the Server Config section above)
            </p>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreatePaymentInstrument}
          disabled={isCreating || !config.apiToken.trim() || !config.storeId.trim()}
          className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isCreating ? (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Payment Instrument...
            </span>
          ) : (
            '🎯 Create Payment Instrument'
          )}
        </button>
      </div>
    </div>
  );
}
