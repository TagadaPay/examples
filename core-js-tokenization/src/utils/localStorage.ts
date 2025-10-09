/**
 * LocalStorage utilities for storing payment history
 */

export interface TokenHistoryItem {
    id: string;
    tagadaToken: string;
    timestamp: number;
    cardLast4: string;
    cardBrand: string;
    label?: string;
}

export interface StoreHistoryItem {
    storeId: string;
    timestamp: number;
    label?: string;
}

const TOKEN_HISTORY_KEY = 'tagadapay_token_history';
const STORE_HISTORY_KEY = 'tagadapay_store_history';
const CURRENT_STORE_KEY = 'tagadapay_current_store';
const MAX_HISTORY_ITEMS = 10;

/**
 * Save a token to history
 */
export function saveTokenToHistory(item: Omit<TokenHistoryItem, 'id' | 'timestamp'>): void {
    try {
        const history = getTokenHistory();
        const newItem: TokenHistoryItem = {
            ...item,
            id: `token_${Date.now()}`,
            timestamp: Date.now(),
        };

        // Add to beginning and limit to MAX_HISTORY_ITEMS
        const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(TOKEN_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving token to history:', error);
    }
}

/**
 * Get token history
 */
export function getTokenHistory(): TokenHistoryItem[] {
    try {
        const stored = localStorage.getItem(TOKEN_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting token history:', error);
        return [];
    }
}

/**
 * Clear token history
 */
export function clearTokenHistory(): void {
    try {
        localStorage.removeItem(TOKEN_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing token history:', error);
    }
}

/**
 * Save store ID to history
 */
export function saveStoreToHistory(storeId: string, label?: string): void {
    try {
        const history = getStoreHistory();
        const newItem: StoreHistoryItem = {
            storeId,
            timestamp: Date.now(),
            label,
        };

        // Remove duplicate if exists
        const filteredHistory = history.filter((item) => item.storeId !== storeId);

        // Add to beginning and limit to MAX_HISTORY_ITEMS
        const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(STORE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Error saving store to history:', error);
    }
}

/**
 * Get store history
 */
export function getStoreHistory(): StoreHistoryItem[] {
    try {
        const stored = localStorage.getItem(STORE_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting store history:', error);
        return [];
    }
}

/**
 * Save current store ID
 */
export function saveCurrentStore(storeId: string): void {
    try {
        localStorage.setItem(CURRENT_STORE_KEY, storeId);
        saveStoreToHistory(storeId);
    } catch (error) {
        console.error('Error saving current store:', error);
    }
}

/**
 * Get current store ID
 */
export function getCurrentStore(): string | null {
    try {
        return localStorage.getItem(CURRENT_STORE_KEY);
    } catch (error) {
        console.error('Error getting current store:', error);
        return null;
    }
}

/**
 * Clear all history
 */
export function clearAllHistory(): void {
    clearTokenHistory();
    try {
        localStorage.removeItem(STORE_HISTORY_KEY);
        localStorage.removeItem(CURRENT_STORE_KEY);
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return minutes === 0 ? 'Just now' : `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    // Format as date
    return date.toLocaleDateString();
}

