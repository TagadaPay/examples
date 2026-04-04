import { useState, useRef } from 'react';
import { useCheckout, useGoogleAutocomplete } from '@tagadapay/headless-sdk/react';
import type { ShippingRate } from '@tagadapay/headless-sdk';
import { CodePanel } from './CodePanel';
import { ResourceId, ResourceIdBar } from './ResourceId';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const googleApiKey = import.meta.env.VITE_GOOGLE_AUTOCOMPLETE_API_KEY ?? '';
  const {
    predictions,
    isLoading: isAutocompleteLoading,
    searchPlaces,
    getPlaceDetails,
    extractFormattedAddress,
    clearPredictions,
  } = useGoogleAutocomplete({ apiKey: googleApiKey, defer: true });

  const handleField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddressInput = (value: string) => {
    handleField('line1', value);
    if (value.length >= 3 && googleApiKey) {
      searchPlaces(value, form.country);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectPrediction = async (placeId: string) => {
    setShowSuggestions(false);
    clearPredictions();
    const details = await getPlaceDetails(placeId);
    if (!details) return;
    const addr = extractFormattedAddress(details);
    setForm((prev) => ({
      ...prev,
      line1: addr.address1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal,
      country: addr.country || prev.country,
    }));
  };

  const handleCustomerSubmit = async () => {
    setError(null);
    try {
      await updateCustomer({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
      });

      const hasAddress = form.line1 || form.city || form.postalCode;

      if (hasAddress) {
        // Shipped product: set shipping address, then fetch rates
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
      } else {
        // Digital product: billing only (just country for tax), skip shipping
        await updateAddress({
          billingAddress: {
            country: form.country,
          },
        });
        onContinue();
      }
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
      <ResourceIdBar>
        <ResourceId label="checkoutToken" value={checkoutToken} />
        {session?.id && <ResourceId label="sessionId" value={session.id} />}
        {(session as any)?.customerId && <ResourceId label="customerId" value={(session as any).customerId} />}
      </ResourceIdBar>

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

          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Address
              {googleApiKey && (
                <span className="ml-1.5 text-[10px] text-emerald-400/60">Google Autocomplete</span>
              )}
            </label>
            <input
              type="text"
              value={form.line1}
              onChange={(e) => handleAddressInput(e.target.value)}
              onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Start typing an address…"
              className={inputClass}
              autoComplete="off"
            />
            {showSuggestions && predictions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl"
              >
                {predictions.map((p) => (
                  <button
                    key={p.place_id}
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    onMouseDown={() => handleSelectPrediction(p.place_id)}
                  >
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>
                      {p.structured_formatting ? (
                        <>
                          <span className="font-medium text-white">{p.structured_formatting.main_text}</span>{' '}
                          <span className="text-white/40">{p.structured_formatting.secondary_text}</span>
                        </>
                      ) : (
                        p.description
                      )}
                    </span>
                  </button>
                ))}
                {isAutocompleteLoading && (
                  <div className="px-3 py-2 text-xs text-white/30">Searching…</div>
                )}
              </div>
            )}
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
            {isLoading
              ? 'Saving...'
              : (form.line1 || form.city || form.postalCode)
                ? 'Continue to Shipping'
                : 'Continue to Payment'}
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

      <div className="space-y-2">
        <CodePanel
          title="Backend — Create Order Bumps & Promotions"
          hookName="node-sdk"
          variant="backend"
          code={`import Tagada from '@tagadapay/node-sdk';
const tagada = new Tagada('tgd_your_api_key');

// Order bumps appear on the checkout page ("Add this too?")
await tagada.offers.create({
  storeId: store.id,
  offerTitle: 'Add Extended Warranty',
  enabled: true,
  type: 'orderbump',     // shown during checkout
  triggers: [{ productId: null, type: 'any' }],
  offers: [{
    productId: warrantyProduct.id,
    variantId: warrantyVariant.id,
    priceId: warrantyVariant.prices[0].id,
    title: '2-Year Extended Warranty — $19',
  }],
  orderBumpOffers: [{
    productId: warrantyProduct.id,
    variantId: warrantyVariant.id,
    title: 'Add Extended Warranty',
  }],
});

// Create a promo code for discounts
await tagada.promotions.create({
  storeId: store.id,
  name: '10% Off Everything',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  enabled: true,
});`}
        />
        <CodePanel
          title="Frontend — Checkout Flow"
          hookName="useCheckout() + useGoogleAutocomplete()"
          code={`import { useCheckout, useGoogleAutocomplete } from '@tagadapay/headless-sdk/react';

const {
  session, updateCustomer, updateAddress,
  getShippingRates, selectShippingRate, applyPromo,
} = useCheckout(checkoutToken, sessionToken);

// Google Places autocomplete for the address field
const {
  predictions, searchPlaces, getPlaceDetails,
  extractFormattedAddress, clearPredictions,
} = useGoogleAutocomplete({
  apiKey: import.meta.env.VITE_GOOGLE_AUTOCOMPLETE_API_KEY,
  defer: true, // loads script on first search
});

// When user types in address field:
searchPlaces(inputValue, 'US');

// When user picks a suggestion:
const details = await getPlaceDetails(prediction.place_id);
const addr = extractFormattedAddress(details);
// addr → { address1, city, state, postal, country }

// 1. Update customer info
await updateCustomer({
  email: 'john@example.com',
  firstName: 'John', lastName: 'Doe',
});

// 2a. SHIPPED product — set shipping address, get rates
await updateAddress({
  shippingAddress: {
    line1: addr.address1, city: addr.city,
    state: addr.state, postalCode: addr.postal, country: addr.country,
  },
});
const rates = await getShippingRates();
await selectShippingRate(rates[0].id);

// 2b. DIGITAL product — billing only, skip shipping
await updateAddress({
  billingAddress: { country: 'FR' },
});
// → Go straight to payment step

// 3. Apply promo code
await applyPromo('SAVE10');`}
        />
      </div>
    </div>
  );
}
