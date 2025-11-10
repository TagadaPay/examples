import type { PaymentToken } from '../../types';
import type { ApplePayTokenResponse } from '@tagadapay/core-js';

interface TokenDisplayProps {
  tokenResult: PaymentToken;
  onCopyToClipboard: (text: string) => void;
}

export function TokenDisplay({ tokenResult, onCopyToClipboard }: TokenDisplayProps) {
  const getTokenValue = () => {
    if (tokenResult.type === 'applePay') {
      return (tokenResult.token as ApplePayTokenResponse).id;
    }
    return tokenResult.tagadaToken || 'No TagadaToken available';
  };

  const getTokenLabel = () => {
    return tokenResult.type === 'applePay' ? 'Apple Pay Token (ID)' : 'TagadaToken (Base64)';
  };

  return (
    <div className="rounded-xl border border-green-200 bg-white p-6 shadow-lg">
      <div className="mb-4 text-center">
        <h3 className="mb-1 text-lg font-bold text-green-800">
          🎯 Step 1: Secure Payment Token
        </h3>
        <p className="text-sm text-green-600">
          {getTokenLabel()}
        </p>
      </div>

      <div className="relative">
        <div className="rounded-lg border border-green-200 bg-gray-900 p-4">
          <code className="block break-all font-mono text-xs leading-relaxed text-green-400">
            {getTokenValue()}
          </code>
        </div>

        <button
          onClick={() => onCopyToClipboard(getTokenValue())}
          className="absolute right-2 top-2 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white shadow transition-all duration-200 hover:bg-green-700"
        >
          📋 Copy
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-green-600">
          ✅ Token created successfully - Ready for Step 2
        </p>
      </div>
    </div>
  );
}
