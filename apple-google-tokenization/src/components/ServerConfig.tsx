import type { ServerConfig } from '../types';

interface ServerConfigProps {
  config: ServerConfig;
  onConfigChange: (config: ServerConfig) => void;
}

export function ServerConfig({ config, onConfigChange }: ServerConfigProps) {
  const handleStoreIdChange = (storeId: string) => {
    onConfigChange({ ...config, storeId });
  };

  const handleApiTokenChange = (apiToken: string) => {
    onConfigChange({ ...config, apiToken });
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-bold text-gray-900">🔧 Server Configuration</h2>
      <p className="mb-4 text-sm text-gray-600">
        Configure your TagadaPay API credentials to create real payment instruments.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store ID
          </label>
          <input
            type="text"
            value={config.storeId}
            onChange={(e) => handleStoreIdChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="store_test_123"
          />
          <p className="mt-1 text-xs text-gray-500">Your TagadaPay store identifier</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Token
          </label>
          <input
            type="password"
            value={config.apiToken}
            onChange={(e) => handleApiTokenChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="sk_test_..."
          />
          <p className="mt-1 text-xs text-gray-500">Your TagadaPay secret API key</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          💡 <strong>Note:</strong> This example makes real API calls to TagadaPay. 
          In production, API tokens should be handled server-side for security.
        </p>
      </div>
    </div>
  );
}
