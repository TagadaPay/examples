import { useState, useEffect } from 'react';
import { useCheckout, useAnalytics } from '@tagadapay/headless-sdk/react';

interface Props {
  checkoutToken: string;
  onBack: () => void;
  onContinue: () => void;
}

export function CheckoutStep({ checkoutToken, onBack, onContinue }: Props) {
  const {
    session,
    isLoading,
    error,
    updateCustomer,
    updateAddress,
    applyPromo,
    removePromo,
    getShippingRates,
    selectShippingRate,
  } = useCheckout(checkoutToken);

  const { trackInitiateCheckout, trackStep } = useAnalytics();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState({ line1: '', city: '', postalCode: '', country: 'US' });
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [shippingRates, setShippingRates] = useState<{ id: string; name: string; amount: number; currency: string; estimatedDays?: number }[]>([]);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    trackInitiateCheckout({ sessionId: session?.id, value: session?.totals?.total, currency: session?.totals?.currency });
    trackStep({ stepName: 'checkout', stepIndex: 1 });
  }, [session?.id, session?.totals?.total, session?.totals?.currency, trackInitiateCheckout, trackStep]);

  useEffect(() => {
    if (session?.customer) {
      setEmail(session.customer.email || '');
      setFirstName(session.customer.firstName || '');
      setLastName(session.customer.lastName || '');
    }
    if (session?.shippingAddress) {
      setAddress({
        line1: session.shippingAddress.line1 || '',
        city: session.shippingAddress.city || '',
        postalCode: session.shippingAddress.postalCode || '',
        country: session.shippingAddress.country || 'US',
      });
    }
  }, [session]);

  const handleSaveCustomer = async () => {
    setSavingCustomer(true);
    try {
      await updateCustomer({ email, firstName, lastName });
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      await updateAddress({ shippingAddress: address });
      const rates = await getShippingRates();
      setShippingRates(rates);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyPromo = async () => {
    setPromoError('');
    try {
      await applyPromo(promoCode);
      setPromoCode('');
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Invalid code');
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);

  if (isLoading && !session) {
    return (
      <div className="card-dark flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-sm text-white/40">Loading checkout session...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-dark border-red-500/20">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-300">Failed to load session</p>
            <p className="mt-1 text-xs text-red-400/60">{error.message}</p>
            <button onClick={onBack} className="btn-ghost mt-3 text-xs">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Order Summary */}
      {session && (
        <div className="card-dark">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Order Summary</h3>

          {session.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover opacity-80" />
                )}
                <div>
                  <p className="text-sm font-medium text-white/80">{item.productName}</p>
                  <p className="text-xs text-white/30">{item.variantName} &times; {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatAmount(item.totalAmount, item.currency)}
              </p>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
            <div className="flex justify-between text-xs text-white/40">
              <span>Subtotal</span>
              <span>{formatAmount(session.totals.subtotal, session.totals.currency)}</span>
            </div>
            {session.totals.discount > 0 && (
              <div className="flex justify-between text-xs text-brand-400">
                <span className="flex items-center gap-1">
                  Discount
                  {session.promotionCode && (
                    <button onClick={() => removePromo()} className="text-white/25 hover:text-white/50 transition-colors">&times;</button>
                  )}
                </span>
                <span>-{formatAmount(session.totals.discount, session.totals.currency)}</span>
              </div>
            )}
            {session.totals.shipping > 0 && (
              <div className="flex justify-between text-xs text-white/40">
                <span>Shipping</span>
                <span>{formatAmount(session.totals.shipping, session.totals.currency)}</span>
              </div>
            )}
            {session.totals.tax > 0 && (
              <div className="flex justify-between text-xs text-white/40">
                <span>Tax</span>
                <span>{formatAmount(session.totals.tax, session.totals.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.06] pt-2 text-sm font-semibold">
              <span>Total</span>
              <span className="text-brand-400">{formatAmount(session.totals.total, session.totals.currency)}</span>
            </div>
          </div>

          {/* Promo Code */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="input-dark flex-1"
                placeholder="Promo code"
              />
              <button
                onClick={handleApplyPromo}
                disabled={!promoCode.trim()}
                className="btn-ghost text-xs whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            {promoError && <p className="mt-1 text-xs text-red-400">{promoError}</p>}
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="card-dark">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Customer</h3>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
            placeholder="Email address"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-dark"
              placeholder="First name"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-dark"
              placeholder="Last name"
            />
          </div>
          <button
            onClick={handleSaveCustomer}
            disabled={savingCustomer || !email}
            className="btn-ghost w-full text-xs"
          >
            {savingCustomer ? 'Saving...' : 'Save Customer Info'}
          </button>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card-dark">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Shipping Address</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            className="input-dark"
            placeholder="Street address"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="input-dark"
              placeholder="City"
            />
            <input
              type="text"
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              className="input-dark"
              placeholder="Postal code"
            />
            <input
              type="text"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              className="input-dark uppercase"
              placeholder="Country"
              maxLength={2}
            />
          </div>
          <button
            onClick={handleSaveAddress}
            disabled={savingAddress || !address.line1}
            className="btn-ghost w-full text-xs"
          >
            {savingAddress ? 'Saving...' : 'Save & Get Shipping Rates'}
          </button>
        </div>

        {/* Shipping Rates */}
        {shippingRates.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-white/40">Select shipping:</p>
            {shippingRates.map((rate) => (
              <button
                key={rate.id}
                onClick={() => selectShippingRate(rate.id)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-brand-500/30 hover:bg-white/[0.05]"
              >
                <div>
                  <p className="text-sm font-medium text-white/80">{rate.name}</p>
                  {rate.estimatedDays && (
                    <p className="text-xs text-white/30">{rate.estimatedDays} business days</p>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {rate.amount === 0 ? 'Free' : formatAmount(rate.amount, rate.currency)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="btn-ghost">
          <svg className="mr-1.5 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <button onClick={onContinue} className="btn-primary">
          Continue to Payment
          <svg className="ml-2 -mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Hook Info */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-500/20">
            <span className="text-[10px]">{'</>'}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white/50">Hooks used on this step</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useCheckout(token)</code>
              <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-brand-300">useAnalytics()</code>
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">
              updateCustomer &middot; updateAddress &middot; applyPromo &middot; getShippingRates &middot; selectShippingRate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
