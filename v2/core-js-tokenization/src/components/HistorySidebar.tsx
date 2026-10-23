/**
 * History Sidebar Component
 * Shows stored tokens and stores for quick access
 */

import { useState } from 'react';
import type { TagadaToken } from './CardForm';
import {
  getTokenHistory,
  getStoreHistory,
  clearAllHistory,
  formatTimestamp,
  type TokenHistoryItem,
  type StoreHistoryItem,
} from '../utils/localStorage';

interface Props {
  onSelectToken: (tagadaToken: string, decodedToken: TagadaToken) => void;
  onSelectStore: (storeId: string) => void;
}

export function HistorySidebar({ onSelectToken, onSelectStore }: Props) {
  const [tokenHistory, setTokenHistory] = useState<TokenHistoryItem[]>(getTokenHistory());
  const [storeHistory, setStoreHistory] = useState<StoreHistoryItem[]>(getStoreHistory());
  const [activeTab, setActiveTab] = useState<'tokens' | 'stores'>('tokens');

  const handleClearHistory = () => {
    if (confirm('Clear all history?')) {
      clearAllHistory();
      setTokenHistory([]);
      setStoreHistory([]);
    }
  };

  const handleSelectToken = (item: TokenHistoryItem) => {
    try {
      const decoded = JSON.parse(atob(item.tagadaToken)) as TagadaToken;
      onSelectToken(item.tagadaToken, decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  if (tokenHistory.length === 0 && storeHistory.length === 0) {
    return null;
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">History</h3>
        {(tokenHistory.length > 0 || storeHistory.length > 0) && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-gray-500 transition-colors hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 pb-2 text-xs font-medium transition-colors ${
            activeTab === 'tokens'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tokens ({tokenHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex-1 pb-2 text-xs font-medium transition-colors ${
            activeTab === 'stores'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Stores ({storeHistory.length})
        </button>
      </div>

      {/* Token History */}
      {activeTab === 'tokens' && (
        <div className="space-y-2">
          {tokenHistory.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">No tokens yet</p>
          ) : (
            tokenHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectToken(item)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">•••• {item.cardLast4}</span>
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium uppercase text-gray-600">
                        {item.cardBrand}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500">{item.label || 'Card token'}</p>
                  </div>
                  <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <div className="mt-2 rounded bg-white px-2 py-1">
                  <code className="block truncate text-xs text-gray-600">{item.tagadaToken}</code>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Store History */}
      {activeTab === 'stores' && (
        <div className="space-y-2">
          {storeHistory.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">No stores yet</p>
          ) : (
            storeHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => onSelectStore(item.storeId)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900">{item.label || item.storeId}</p>
                    {item.label && (
                      <code className="mt-1 block truncate text-xs text-gray-500">{item.storeId}</code>
                    )}
                  </div>
                  <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
