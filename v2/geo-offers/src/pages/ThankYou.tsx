import { Link, useSearchParams } from 'react-router-dom';
import { useOrder } from '@tagadapay/headless-sdk/react';
import type { Order } from '@tagadapay/headless-sdk';
import { formatPrice } from '../lib/format';
import { TUTORIAL_URL } from '../lib/config';

/**
 * Thank you. `useOrder` paints the tee immediately, then fills in
 * relatedOrders as accepted OTOs land (up to 8s).
 */
export function ThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const { order, relatedOrders, isLoading } = useOrder(orderId);

  if (!orderId) {
    return (
      <main className="page">
        <div className="card">
          <h1>Missing order</h1>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading && !order) {
    return (
      <main className="page">
        <p>Loading your order…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page">
        <div className="card">
          <h1>Order not found</h1>
          <Link className="btn" to="/">
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  const extra = relatedOrders.length
    ? ` + ${relatedOrders.length} add-on${relatedOrders.length === 1 ? '' : 's'}`
    : '';

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Showcase
        </Link>
        <a href={TUTORIAL_URL} target="_blank" rel="noreferrer">
          Tutorial
        </a>
      </header>

      <div className="card">
        <p className="eyebrow">Thank you</p>
        <h1>You are all set{extra}</h1>
        <p className="hint">
          Accepted offers are <strong>child orders</strong> on this page — not extra lines on the
          tee. See <code>relatedOrders</code> in the tutorial.
        </p>

        <OrderBlock label="Main order" order={order} />
        {relatedOrders.map((child, index) => (
          <OrderBlock key={child.id} label={`Add-on ${index + 1}`} order={child} />
        ))}

        <p className="total">
          Combined total{' '}
          {formatPrice(
            [order, ...relatedOrders].reduce((sum, item) => sum + item.amount, 0),
            order.currency,
          )}
        </p>

        <Link className="btn" to="/">
          Run it again
        </Link>
      </div>
    </main>
  );
}

function OrderBlock({ label, order }: { label: string; order: Order }) {
  return (
    <section className="order-block">
      <h2>
        {label} <code>{order.id}</code>
      </h2>
      <ul>
        {order.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatPrice(item.totalAmount, order.currency)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
