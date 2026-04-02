import { useState } from 'react';
import { useHeadlessClient, useAnalytics } from '@tagadapay/headless-sdk/react';
import type { CartItem } from '../App';

interface CartDrawerProps {
  cart: CartItem[];
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
  onBack: () => void;
  onSessionCreated: (data: { checkoutToken: string; sessionToken: string }) => void;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function CartDrawer({ cart, onUpdateQuantity, onRemove, onBack, onSessionCreated }: CartDrawerProps) {
  const client = useHeadlessClient();
  const { trackInitiateCheckout } = useAnalytics();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = cart[0]?.currency ?? 'USD';

  const handleCheckout = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const lineItems = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        ...(item.priceId ? { priceId: item.priceId } : {}),
      }));

      trackInitiateCheckout({ value: total, currency });

      const result = await client.checkout.createSession({
        items: lineItems,
        currency,
      });

      onSessionCreated({
        checkoutToken: result.checkoutToken,
        sessionToken: result.sessionToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsCreating(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="card-dark p-8 text-center animate-fade-in">
        <svg className="mx-auto h-12 w-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V5.632c0-.724-.49-1.359-1.196-1.442A49.007 49.007 0 0 0 7.5 3.78" />
        </svg>
        <p className="mt-4 text-sm text-white/50">Your cart is empty</p>
        <button onClick={onBack} className="btn-primary mt-4 px-6 py-2 text-xs">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Your Cart</h2>
        <button onClick={onBack} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
          &larr; Continue Shopping
        </button>
      </div>

      <div className="card-dark divide-y divide-white/[0.06] overflow-hidden">
        {cart.map((item) => (
          <div key={item.variantId} className="flex items-center gap-4 px-5 py-4">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName} className="h-14 w-14 rounded-lg object-cover bg-white/5" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5">
                <svg className="h-6 w-6 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{item.productName}</p>
              {item.variantName !== item.productName && (
                <p className="text-xs text-white/40">{item.variantName}</p>
              )}
              <p className="mt-0.5 text-sm font-semibold text-white">{formatPrice(item.price, item.currency)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.variantId, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/60 transition hover:bg-white/10"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium text-white/90">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.variantId, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/60 transition hover:bg-white/10"
              >
                +
              </button>
              <button
                onClick={() => onRemove(item.variantId)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="card-dark px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="text-lg font-bold text-white">{formatPrice(total, currency)}</span>
        </div>
        <p className="mt-1 text-xs text-white/30">Shipping and taxes calculated at checkout</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isCreating}
        className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
      >
        {isCreating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating checkout session...
          </span>
        ) : (
          'Proceed to Checkout'
        )}
      </button>
    </div>
  );
}
