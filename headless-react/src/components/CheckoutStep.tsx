import { useState, useEffect } from 'react';
import { useCheckout, useAnalytics } from '@tagadapay/headless-sdk/react';
import type { ShippingRate } from '@tagadapay/headless-sdk';

interface CheckoutStepProps {
  checkoutToken: string;
  sessionToken: string;
  onBack: () => void;
  onContinue: () => void;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  promoCode: string;
}

export function CheckoutStep({ checkoutToken, sessionToken, onBack, onContinue }: CheckoutStepProps) {
  const {
    session,
    updateCustomer,
    updateAddress,
    getShippingRates,
    selectShippingRate,
    applyPromo,
    isLoading,
  } = useCheckout(checkoutToken, sessionToken);

  const { trackPageView, trackStep } = useAnalytics();

  const [form, setForm] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    promoCode: '',
  });

  const [step, setStep] = useState<'customer' | 'shipping'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'applying' | 'applied' | 'error'>('idle');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('checkout');
    trackStep({ stepName: 'checkout_info' });
  }, [trackPageView, trackStep]);

  const handleField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomerSubmit = async () => {
    setError(null);
    try {
      await updateCustomer({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      await updateAddress({
        shippingAddress: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      });
      const fetchedRates = await getShippingRates();
      setRates(fetchedRates);
      setStep('shipping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update information');
    }
  };

  const handleShippingSubmit = async () => {
    setError(null);
    if (!selectedRateId) {
      setError('Please select a shipping method');
      return;
    }
    try {
      await selectShippingRate(selectedRateId);
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select shipping');
    }
  };

  const handleApplyPromo = async () => {
    if (!form.promoCode.trim()) return;
    setPromoStatus('applying');
    try {
      await applyPromo(form.promoCode.trim());
      setPromoStatus('applied');
    } catch {
      setPromoStatus('error');
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);

  const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">
          {step === 'customer' ? 'Your Information' : 'Shipping Method'}
        </h2>
        <button onClick={onBack} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
          &larr; Back to Cart
        </button>
      </div>

      {/* Order summary */}
      {session && (
        <div className="card-dark px-5 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">
              {session.items?.length ?? 0} item(s)
            </span>
            <span className="font-semibold text-white">
              {formatAmount(session.totals?.total ?? 0, session.totals?.currency ?? 'USD')}
            </span>
          </div>
        </div>
      )}

      {step === 'customer' && (
        <div className="card-dark space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleField('email', e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">First Name</label>
              <input type="text" value={form.firstName} onChange={(e) => handleField('firstName', e.target.value)} placeholder="John" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Last Name</label>
              <input type="text" value={form.lastName} onChange={(e) => handleField('lastName', e.target.value)} placeholder="Doe" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Address</label>
            <input type="text" value={form.line1} onChange={(e) => handleField('line1', e.target.value)} placeholder="123 Main St" className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">City</label>
              <input type="text" value={form.city} onChange={(e) => handleField('city', e.target.value)} placeholder="New York" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">State</label>
              <input type="text" value={form.state} onChange={(e) => handleField('state', e.target.value)} placeholder="NY" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Postal Code</label>
              <input type="text" value={form.postalCode} onChange={(e) => handleField('postalCode', e.target.value)} placeholder="10001" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Country</label>
            <select value={form.country} onChange={(e) => handleField('country', e.target.value)} className={inputClass}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
            </select>
          </div>

          {/* Promo code */}
          <div className="border-t border-white/[0.06] pt-4">
            <label className="mb-1.5 block text-xs font-medium text-white/50">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.promoCode}
                onChange={(e) => { handleField('promoCode', e.target.value); setPromoStatus('idle'); }}
                placeholder="SAVE10"
                className={`${inputClass} flex-1`}
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoStatus === 'applying' || !form.promoCode.trim()}
                className="rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-medium text-white/70 transition hover:bg-white/10 disabled:opacity-40"
              >
                {promoStatus === 'applying' ? '...' : 'Apply'}
              </button>
            </div>
            {promoStatus === 'applied' && <p className="mt-1 text-xs text-green-400">Promo applied!</p>}
            {promoStatus === 'error' && <p className="mt-1 text-xs text-red-400">Invalid promo code</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleCustomerSubmit}
            disabled={isLoading || !form.email || !form.firstName || !form.lastName}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Continue to Shipping'}
          </button>
        </div>
      )}

      {step === 'shipping' && (
        <div className="card-dark space-y-4 px-5 py-5">
          {rates.length > 0 ? (
            <div className="space-y-2">
              {rates.map((rate) => (
                <label
                  key={rate.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                    selectedRateId === rate.id
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={rate.id}
                    checked={selectedRateId === rate.id}
                    onChange={() => setSelectedRateId(rate.id)}
                    className="accent-brand-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">{rate.name}</p>
                    {rate.estimatedDays && <p className="text-xs text-white/40">{rate.estimatedDays} business days</p>}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {rate.amount === 0 ? 'Free' : formatAmount(rate.amount, rate.currency)}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-sm text-white/50">
                {isLoading ? 'Loading shipping options...' : 'No shipping rates available — you can continue.'}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('customer')}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
            >
              Back
            </button>
            <button
              onClick={rates.length > 0 ? handleShippingSubmit : onContinue}
              disabled={isLoading || (rates.length > 0 && !selectedRateId)}
              className="btn-primary flex-1 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
