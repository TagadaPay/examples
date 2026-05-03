import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useCheckout,
  useGoogleAutocomplete,
  usePayment,
} from '@tagadapay/headless-sdk/react';
import type { ShippingRate } from '@tagadapay/headless-sdk';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/format';
import { GOOGLE_AUTOCOMPLETE_API_KEY } from '../lib/config';

/**
 * Single-page checkout: contact + shipping + payment, with order summary.
 *
 * Flow on "Place order":
 *   1. updateCustomer({ email, firstName, lastName })
 *   2. updateAddress({ shippingAddress, billingAddress })
 *   3. selectShippingRate(id) — if rates exist
 *   4. (optional) applyPromo(code)
 *   5. tokenizeCard({...}) → tagadaToken
 *   6. processPayment({ checkoutSessionId, tagadaToken })
 *      - succeeded → /thank-you/{orderId}
 *      - requires_redirect → SDK handles redirect; we resume on return
 *      - failed → show error
 */
export function Checkout() {
  const [params] = useSearchParams();
  const checkoutToken = params.get('checkoutToken');
  const sessionToken = params.get('sessionToken') ?? undefined;

  if (!checkoutToken) return <Navigate to="/cart" replace />;

  return <CheckoutInner checkoutToken={checkoutToken} sessionToken={sessionToken} />;
}

function CheckoutInner({ checkoutToken, sessionToken }: { checkoutToken: string; sessionToken?: string }) {
  const navigate = useNavigate();
  const { clear } = useCart();

  const {
    session,
    isLoading: isCheckoutLoading,
    updateCustomer,
    updateAddress,
    getShippingRates,
    selectShippingRate,
    applyPromo,
    removePromo,
  } = useCheckout(checkoutToken, sessionToken);

  const {
    loadPaymentSetup,
    tokenizeCard,
    processPayment,
    isProcessing,
  } = usePayment({
    onPaymentSuccess: (result) => {
      clear();
      navigate(`/thank-you/${encodeURIComponent(result.payment.id)}`, { replace: true });
    },
  });

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });

  // Promo
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'applying' | 'applied' | 'error'>('idle');

  // Shipping
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const ratesAbortRef = useRef(0);

  // Submission
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'updating' | 'tokenizing' | 'paying' | 'redirecting'>('idle');

  // Load payment setup once we have a session id
  useEffect(() => {
    if (session?.id) loadPaymentSetup(session.id);
  }, [loadPaymentSetup, session?.id]);

  // Auto-fetch shipping rates whenever the address looks complete
  useEffect(() => {
    if (!postalCode || !line1 || !city || !country) {
      setRates([]);
      setSelectedRateId(null);
      return;
    }

    const myToken = ++ratesAbortRef.current;
    const handle = window.setTimeout(async () => {
      setRatesLoading(true);
      try {
        await updateAddress({
          shippingAddress: { line1, line2: line2 || undefined, city, state: region, postalCode, country },
          billingAddress:  { line1, line2: line2 || undefined, city, state: region, postalCode, country },
        });
        const fetched = await getShippingRates();
        if (myToken !== ratesAbortRef.current) return;
        setRates(fetched);
        if (fetched.length > 0) setSelectedRateId((prev) => prev ?? fetched[0].id);
      } catch {
        if (myToken === ratesAbortRef.current) {
          setRates([]);
          setSelectedRateId(null);
        }
      } finally {
        if (myToken === ratesAbortRef.current) setRatesLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(handle);
  }, [line1, line2, city, region, postalCode, country, updateAddress, getShippingRates]);

  // Google Places autocomplete — optional (degrade gracefully if no key).
  const {
    predictions,
    searchPlaces,
    getPlaceDetails,
    extractFormattedAddress,
    clearPredictions,
  } = useGoogleAutocomplete({ apiKey: GOOGLE_AUTOCOMPLETE_API_KEY, defer: true });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const handleAddressInput = (value: string) => {
    setLine1(value);
    if (value.length >= 3 && GOOGLE_AUTOCOMPLETE_API_KEY) {
      searchPlaces(value, country);
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
    setLine1(addr.address1);
    setCity(addr.city);
    setRegion(addr.state);
    setPostalCode(addr.postal);
    if (addr.country) setCountry(addr.country);
  };

  // Promo handlers
  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setPromoStatus('applying');
    try {
      await applyPromo(code);
      setPromoStatus('applied');
    } catch {
      setPromoStatus('error');
    }
  };
  const handleRemovePromo = async () => {
    try {
      await removePromo();
    } finally {
      setPromoCode('');
      setPromoStatus('idle');
    }
  };

  // Validation
  const fieldsFilled =
    email.includes('@') &&
    firstName.trim() &&
    lastName.trim() &&
    line1.trim() &&
    city.trim() &&
    postalCode.trim() &&
    card.number.replace(/\s/g, '').length >= 12 &&
    card.exp.replace(/\D/g, '').length >= 3 &&
    card.cvc.length >= 3 &&
    card.name.trim();

  const handlePlaceOrder = async () => {
    if (!session?.id) return;
    setError(null);

    try {
      setStage('updating');
      await updateCustomer({ email, firstName, lastName });

      // updateAddress was already called by the auto-rate effect, but call it
      // again to be safe with the latest values.
      await updateAddress({
        shippingAddress: { line1, line2: line2 || undefined, city, state: region, postalCode, country },
        billingAddress:  { line1, line2: line2 || undefined, city, state: region, postalCode, country },
      });

      if (rates.length > 0) {
        const rateId = selectedRateId ?? rates[0].id;
        await selectShippingRate(rateId);
      }

      setStage('tokenizing');
      const expiryDate = card.exp.replace(/\s/g, '').replace(/\//g, '');
      const { tagadaToken } = await tokenizeCard({
        cardNumber: card.number.replace(/\s/g, ''),
        expiryDate,
        cvc: card.cvc,
        cardholderName: card.name,
      });

      setStage('paying');
      const result = await processPayment({
        checkoutSessionId: session.id,
        tagadaToken,
      });

      switch (result.status) {
        case 'succeeded':
          // onPaymentSuccess hook handles navigation + cart clear
          break;
        case 'requires_redirect':
          setStage('redirecting');
          // browser is being redirected by the SDK
          break;
        case 'failed':
          setError(result.error || 'Payment failed.');
          setStage('idle');
          break;
        case 'pending':
          setError('Payment is still processing. Please wait a moment then refresh.');
          setStage('idle');
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('idle');
    }
  };

  const total = session?.totals?.total ?? 0;
  const sessionCurrency = session?.totals?.currency ?? 'USD';

  const placeOrderLabel = useMemo(() => {
    if (stage === 'updating') return 'Saving your details…';
    if (stage === 'tokenizing') return 'Securing your card…';
    if (stage === 'paying') return 'Processing payment…';
    if (stage === 'redirecting') return 'Redirecting to your bank…';
    return total ? `Place order · ${formatPrice(total, sessionCurrency)}` : 'Place order';
  }, [stage, total, sessionCurrency]);

  const isBusy = stage !== 'idle' || isProcessing;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        {/* ─── Left: form ─── */}
        <div className="space-y-8">
          {/* Contact */}
          <Section title="Contact">
            <Field label="Email">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>
          </Section>

          {/* Shipping */}
          <Section title="Shipping address">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name">
                <input
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Last name">
                <input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Address" hint={GOOGLE_AUTOCOMPLETE_API_KEY ? 'Powered by Google Places' : undefined}>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="address-line1"
                  value={line1}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="123 Main St"
                  className={inputClass}
                />
                {showSuggestions && predictions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-lg">
                    {predictions.map((p) => (
                      <button
                        key={p.place_id}
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-50"
                        onMouseDown={() => handleSelectPrediction(p.place_id)}
                      >
                        <span>
                          {p.structured_formatting ? (
                            <>
                              <strong className="font-medium text-ink-900">{p.structured_formatting.main_text}</strong>{' '}
                              <span className="text-ink-500">{p.structured_formatting.secondary_text}</span>
                            </>
                          ) : (
                            p.description
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Apartment, suite, etc. (optional)">
              <input
                type="text"
                autoComplete="address-line2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="City">
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="State / Region">
                <input
                  type="text"
                  autoComplete="address-level1"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Postal code">
                <input
                  type="text"
                  autoComplete="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Country">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
                <option value="AU">Australia</option>
              </select>
            </Field>
          </Section>

          {/* Shipping rates */}
          {(rates.length > 0 || ratesLoading) && (
            <Section title="Delivery">
              {ratesLoading && rates.length === 0 ? (
                <div className="rounded-xl border border-ink-200 bg-white px-4 py-4 text-sm text-ink-500">
                  Calculating shipping rates…
                </div>
              ) : (
                <div className="space-y-2">
                  {rates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition ${
                        selectedRateId === rate.id ? 'border-ink-900 ring-1 ring-ink-900' : 'border-ink-200 hover:border-ink-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedRateId === rate.id}
                        onChange={() => setSelectedRateId(rate.id)}
                        className="h-4 w-4 accent-ink-900"
                      />
                      <span className="flex-1">
                        <span className="font-medium text-ink-900">{rate.name}</span>
                        {rate.estimatedDays && (
                          <span className="ml-2 text-xs text-ink-500">{rate.estimatedDays} business days</span>
                        )}
                      </span>
                      <span className="font-medium text-ink-900">
                        {rate.amount === 0 ? 'Free' : formatPrice(rate.amount, rate.currency)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Payment */}
          <Section title="Payment" subtitle="All transactions are secure and encrypted.">
            <Field label="Card number">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.number}
                onChange={(e) =>
                  setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))
                }
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className={`${inputClass} font-mono`}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Expiration (MM/YY)">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.exp}
                  onChange={(e) => setCard((c) => ({ ...c, exp: formatExp(e.target.value) }))}
                  placeholder="12 / 28"
                  maxLength={7}
                  className={`${inputClass} font-mono`}
                />
              </Field>
              <Field label="CVC">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvc}
                  onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="123"
                  maxLength={4}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>

            <Field label="Cardholder name">
              <input
                type="text"
                autoComplete="cc-name"
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                placeholder="John Doe"
                className={inputClass}
              />
            </Field>

            <p className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              <span className="font-medium text-ink-700">Test card:</span>{' '}
              <code className="font-mono">4242 4242 4242 4242</code> · any future expiry · any 3-digit CVC
            </p>
          </Section>

          {/* Submit */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!fieldsFilled || isBusy || isCheckoutLoading || !session?.id}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-medium text-ink-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placeOrderLabel}
          </button>

          <p className="text-center text-xs text-ink-400">
            By placing this order, you agree to our terms · Powered by TagadaPay
          </p>
        </div>

        {/* ─── Right: order summary ─── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-ink-200 bg-white">
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-700">Order summary</p>
              <Link to="/cart" className="text-xs text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline">
                Edit
              </Link>
            </div>

            <ul className="divide-y divide-ink-100">
              {(session?.items ?? []).map((item, i) => (
                <li key={`${item.variantId}-${i}`} className="flex gap-3 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-medium text-ink-50">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{item.productName}</p>
                    {item.variantName && item.variantName !== item.productName && (
                      <p className="truncate text-xs text-ink-500">{item.variantName}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-ink-900">
                    {formatPrice(item.totalAmount ?? item.unitAmount * item.quantity, sessionCurrency)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Promo */}
            <div className="border-t border-ink-200 px-5 py-4">
              {!showPromo && promoStatus !== 'applied' && (
                <button
                  type="button"
                  onClick={() => setShowPromo(true)}
                  className="text-xs text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline"
                >
                  Have a discount code?
                </button>
              )}
              {(showPromo || promoStatus === 'applied') && promoStatus !== 'applied' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoStatus('idle');
                    }}
                    placeholder="Discount code"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || promoStatus === 'applying'}
                    className="rounded-xl border border-ink-300 bg-white px-4 text-xs font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-40"
                  >
                    {promoStatus === 'applying' ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {promoStatus === 'error' && <p className="mt-1 text-xs text-red-600">Code not valid.</p>}
              {promoStatus === 'applied' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700">
                    Discount applied: <code className="font-mono">{promoCode}</code>
                  </span>
                  <button type="button" onClick={handleRemovePromo} className="text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-ink-200 px-5 py-4 text-sm">
              <SummaryRow label="Subtotal" value={formatPrice(session?.totals?.subtotal ?? 0, sessionCurrency)} />
              {(session?.totals?.discount ?? 0) > 0 && (
                <SummaryRow label="Discount" value={`− ${formatPrice(session!.totals.discount, sessionCurrency)}`} valueClass="text-emerald-700" />
              )}
              <SummaryRow
                label="Shipping"
                value={
                  (session?.totals?.shipping ?? 0) > 0
                    ? formatPrice(session!.totals.shipping, sessionCurrency)
                    : rates.length === 0
                      ? <span className="text-ink-500">Calculated next</span>
                      : 'Free'
                }
              />
              {(session?.totals?.tax ?? 0) > 0 && (
                <SummaryRow label="Taxes" value={formatPrice(session!.totals.tax, sessionCurrency)} />
              )}
              <div className="flex items-baseline justify-between border-t border-ink-200 pt-3 text-base">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="font-semibold text-ink-900">{formatPrice(total, sessionCurrency)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-ink-300 bg-white px-3.5 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-ink-900 focus:ring-1 focus:ring-ink-900';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-medium text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-ink-700">
        {label}
        {hint && <span className="text-[10px] font-normal text-ink-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-600">{label}</span>
      <span className={valueClass ?? 'text-ink-800'}>{value}</span>
    </div>
  );
}

function formatCardNumber(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExp(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}
