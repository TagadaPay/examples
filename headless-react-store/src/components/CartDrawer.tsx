import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { useCartUI } from '../lib/cart-ui';
import { useStartCheckout } from '../lib/use-start-checkout';
import { formatPrice } from '../lib/format';
import { FreeShippingBar } from './FreeShippingBar';

/**
 * Slide-out mini-cart. Opens from the header cart button and whenever an item
 * is added, so buyers never lose their place. Checkout starts right here — the
 * full `/cart` page is a secondary path for editing.
 */
export function CartDrawer() {
  const { isOpen, close } = useCartUI();
  const { lines, itemCount, subtotalCents, currency, setQuantity, removeLine } = useCart();
  const { start, submitting, error } = useStartCheckout();
  const { pathname } = useLocation();

  // Never overlay the focused conversion pages.
  useEffect(() => {
    if (pathname.startsWith('/checkout') || pathname.startsWith('/thank-you')) close();
  }, [pathname, close]);

  // ESC to close + lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  const handleCheckout = async () => {
    await start();
    close();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out-expo ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h2 className="font-display text-lg font-medium text-ink-900">
            Cart <span className="text-ink-400">({itemCount})</span>
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-ink-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V5.632c0-.724-.49-1.359-1.196-1.442A49.007 49.007 0 0 0 7.5 3.78" />
              </svg>
            </span>
            <p className="font-display text-xl text-ink-900">Your cart is empty</p>
            <p className="text-sm text-ink-500">Add something you'll love, it lands right here.</p>
            <button type="button" onClick={close} className="btn-primary mt-2 h-11 px-5">
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free-shipping nudge */}
            <div className="border-b border-ink-100 px-5 py-4">
              <FreeShippingBar subtotalCents={subtotalCents} currency={currency} />
            </div>

            {/* Lines */}
            <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-3 py-4">
                  <Link
                    to={`/product/${line.variantId}`}
                    onClick={close}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100"
                  >
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.productName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-ink-300">—</span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${line.variantId}`}
                          onClick={close}
                          className="block truncate text-sm font-medium text-ink-900 hover:underline"
                        >
                          {line.productName}
                        </Link>
                        {line.variantName && line.variantName !== line.productName && (
                          <p className="mt-0.5 truncate text-xs text-ink-500">{line.variantName}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-medium text-ink-900">
                        {formatPrice(line.price * line.quantity, line.currency)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-ink-300 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.variantId, Math.max(0, line.quantity - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-l-full text-ink-600 transition hover:bg-ink-100"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-r-full text-ink-600 transition hover:bg-ink-100"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.variantId)}
                        className="text-xs text-ink-500 underline-offset-2 transition hover:text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="space-y-3 border-t border-ink-200 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-600">Subtotal</span>
                <span className="text-base font-semibold text-ink-900">
                  {formatPrice(subtotalCents, currency)}
                </span>
              </div>
              <p className="text-xs text-ink-400">Shipping and taxes calculated at checkout.</p>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting}
                className="btn-primary h-12 w-full px-6"
              >
                {submitting && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-ink-50/30 border-t-ink-50" />
                )}
                {submitting ? 'Starting secure checkout…' : 'Checkout'}
              </button>
              <Link
                to="/cart"
                onClick={close}
                className="block text-center text-xs text-ink-500 transition hover:text-ink-900"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
