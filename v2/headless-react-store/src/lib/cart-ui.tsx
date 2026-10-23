import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * UI-only cart state: whether the slide-out cart drawer is open.
 *
 * Kept separate from `useCart()` (which owns the localStorage cart data) so a
 * component can add an item AND pop the drawer without those two concerns
 * bleeding into each other.
 */
interface CartUI {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CartUIContext = createContext<CartUI | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error('useCartUI must be used within <CartUIProvider>');
  return ctx;
}
