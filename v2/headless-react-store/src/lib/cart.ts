import { useCallback, useEffect, useState } from 'react';

/**
 * Cart state lives in `localStorage` so it survives reloads.
 *
 * Each line is keyed by `variantId`. We deliberately store only what we need
 * to render the cart UI without re-fetching the catalog — name, price, image —
 * so the cart shows instantly when you open it.
 *
 * When checkout starts, we send `{ variantId, priceId, quantity }` to the
 * Headless SDK and it computes the authoritative totals server-side.
 */
export interface CartLine {
  variantId: string;
  priceId?: string;
  productName: string;
  variantName: string;
  /** Per-unit price in minor units (cents). */
  price: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
}

const STORAGE_KEY = 'north-cart-v1';

function readStorage(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

/**
 * `useCart()` — returns the current cart and helpers to mutate it.
 *
 * Multiple components can call this; they all stay in sync via the
 * `tagada-cart-changed` window event we dispatch on every write.
 */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => readStorage());

  // Keep all `useCart` consumers in sync (header badge, drawer, cart page).
  useEffect(() => {
    const handler = () => setLines(readStorage());
    window.addEventListener('tagada-cart-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('tagada-cart-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    writeStorage(next);
    setLines(next);
    window.dispatchEvent(new CustomEvent('tagada-cart-changed'));
  }, []);

  const addLine = useCallback(
    (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => {
      const current = readStorage();
      const qty = line.quantity ?? 1;
      const existing = current.find((l) => l.variantId === line.variantId);
      const next = existing
        ? current.map((l) =>
            l.variantId === line.variantId ? { ...l, quantity: l.quantity + qty } : l,
          )
        : [...current, { ...line, quantity: qty }];
      persist(next);
    },
    [persist],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      const current = readStorage();
      const next =
        quantity <= 0
          ? current.filter((l) => l.variantId !== variantId)
          : current.map((l) => (l.variantId === variantId ? { ...l, quantity } : l));
      persist(next);
    },
    [persist],
  );

  const removeLine = useCallback(
    (variantId: string) => {
      persist(readStorage().filter((l) => l.variantId !== variantId));
    },
    [persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalCents = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const currency = lines[0]?.currency ?? 'USD';

  return {
    lines,
    itemCount,
    subtotalCents,
    currency,
    addLine,
    setQuantity,
    removeLine,
    clear,
  };
}
