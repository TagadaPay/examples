import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHeadlessClient } from '@tagadapay/headless-sdk/react';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/format';

export function Cart() {
  const { lines, itemCount, subtotalCents, currency, setQuantity, removeLine } = useCart();
  const client = useHeadlessClient();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (lines.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        ...(l.priceId ? { priceId: l.priceId } : {}),
      }));

      const result = await client.checkout.createSession({ items, currency });

      navigate(
        `/checkout?checkoutToken=${encodeURIComponent(result.checkoutToken)}&sessionToken=${encodeURIComponent(result.sessionToken)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0) return <EmptyCart />;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-12">
        <ul className="divide-y divide-ink-200 border-y border-ink-200">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-6">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-28 sm:w-28">
                {line.imageUrl ? (
                  <img src={line.imageUrl} alt={line.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-300">—</div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${line.variantId}`}
                      className="text-sm font-medium text-ink-900 hover:underline"
                    >
                      {line.productName}
                    </Link>
                    {line.variantName && line.variantName !== line.productName && (
                      <p className="mt-0.5 text-xs text-ink-500">{line.variantName}</p>
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
                      className="flex h-9 w-9 items-center justify-center rounded-l-full text-ink-600 hover:bg-ink-100"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-r-full text-ink-600 hover:bg-ink-100"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.variantId)}
                    className="text-xs text-ink-500 underline-offset-2 hover:text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-700">Summary</h2>
          <Row label="Subtotal" value={formatPrice(subtotalCents, currency)} />
          <Row label="Shipping" value={<span className="text-ink-500">Calculated at checkout</span>} />
          <Row label="Taxes" value={<span className="text-ink-500">Calculated at checkout</span>} />
          <div className="border-t border-ink-200 pt-3">
            <div className="flex justify-between text-base">
              <span className="font-medium text-ink-900">Estimated total</span>
              <span className="font-semibold text-ink-900">{formatPrice(subtotalCents, currency)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
          >
            {submitting ? 'Starting secure checkout…' : 'Checkout'}
          </button>

          <Link to="/" className="block text-center text-xs text-ink-500 hover:text-ink-900">
            Continue shopping
          </Link>

          <p className="border-t border-ink-200 pt-3 text-center text-[11px] text-ink-400">
            Payments handled by TagadaPay · 3DS · Multi-PSP
          </p>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-600">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ink-200 bg-white">
        <svg className="h-6 w-6 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V5.632c0-.724-.49-1.359-1.196-1.442A49.007 49.007 0 0 0 7.5 3.78" />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-900">Your cart is empty</h1>
      <p className="mt-2 text-ink-500">Browse the collection and find something you'll love.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-900 px-5 text-sm font-medium text-ink-50 hover:bg-ink-800"
      >
        Shop the collection
      </Link>
    </section>
  );
}
