import { CheckCircle2 } from 'lucide-react';
import type { ApplePayTokenResponse } from '@tagadapay/core-js';

interface TokenResultProps {
  type: 'applePay' | 'googlePay';
  tagadaToken?: string;
  token: ApplePayTokenResponse | Record<string, unknown>;
  details: Record<string, unknown>;
}

export function TokenResult({ type, tagadaToken, token, details }: TokenResultProps) {
  return (
    <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-green-200">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-slate-900">
          Tokenization Successful
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Payment Method
          </h3>
          <p className="text-lg font-medium text-slate-900">
            {type === 'applePay' ? 'Apple Pay' : 'Google Pay'}
            {type === 'googlePay' && ' (using @tagadapay/core-js)'}
          </p>
        </div>

        {type === 'googlePay' && tagadaToken && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
              TagadaToken (Ready for Backend)
            </h3>
            <pre className="bg-green-50 border-2 border-green-200 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-800 break-all">
              {tagadaToken}
            </pre>
            <p className="text-xs text-slate-500 mt-2">
              This is the standardized TagadaToken that you would send to your backend API
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Token Data
          </h3>
          <pre className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-800">
            {JSON.stringify(token, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Full Payment Details
          </h3>
          <pre className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-800 max-h-96">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
