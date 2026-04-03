import { useState, useCallback, useEffect } from 'react';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import type { Environment, CatalogVariant } from '@tagadapay/headless-sdk';
import { GettingStarted } from './components/GettingStarted';
import { StepIndicator } from './components/StepIndicator';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutStep } from './components/CheckoutStep';
import { PaymentStep } from './components/PaymentStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import { WhatsNext } from './components/WhatsNext';

export interface AppConfig {
  storeId: string;
  environment: Environment;
}

export interface CartItem {
  variantId: string;
  priceId?: string;
  productName: string;
  variantName: string;
  price: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
}

const STEPS = ['Products', 'Cart', 'Checkout', 'Payment', 'Confirmation'] as const;
export type Step = (typeof STEPS)[number];

const STORAGE_KEY = 'tagada-demo-state';

interface PersistedState {
  config: AppConfig;
  currentStep: Step;
  cart: CartItem[];
  sessionData: { checkoutToken: string; sessionToken: string } | null;
  paymentId: string | null;
}

function loadPersistedState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return null;
  }
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

function App() {
  const saved = loadPersistedState();

  const [config, setConfig] = useState<AppConfig>(
    saved?.config ?? {
      storeId: import.meta.env.VITE_STORE_ID ?? '',
      environment: (import.meta.env.VITE_ENVIRONMENT as Environment) ?? 'production',
    },
  );

  const [currentStep, setCurrentStep] = useState<Step>(saved?.currentStep ?? 'Products');
  const [configOpen, setConfigOpen] = useState(!saved?.config?.storeId);
  const [cart, setCart] = useState<CartItem[]>(saved?.cart ?? []);
  const [sessionData, setSessionData] = useState<{ checkoutToken: string; sessionToken: string } | null>(
    saved?.sessionData ?? null,
  );
  const [paymentId, setPaymentId] = useState<string | null>(saved?.paymentId ?? null);

  useEffect(() => {
    persistState({ config, currentStep, cart, sessionData, paymentId });
  }, [config, currentStep, cart, sessionData, paymentId]);

  const isConfigured = config.storeId.trim() !== '';

  const goTo = useCallback((step: Step) => setCurrentStep(step), []);

  const addToCart = useCallback((variant: CatalogVariant, productName: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      const defaultPrice = variant.prices?.find((p) => p.default) ?? variant.prices?.[0];
      const currency = variant.currency ?? 'USD';
      const currencyOpt = defaultPrice?.currencyOptions?.[currency]
        ?? defaultPrice?.currencyOptions?.[Object.keys(defaultPrice.currencyOptions ?? {})[0]];

      return [
        ...prev,
        {
          variantId: variant.id,
          priceId: defaultPrice?.id,
          productName,
          variantName: variant.name,
          price: currencyOpt?.amount ?? variant.price ?? 0,
          currency,
          imageUrl: variant.imageUrl ?? undefined,
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.variantId === variantId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const handleSessionCreated = useCallback((data: { checkoutToken: string; sessionToken: string }) => {
    setSessionData(data);
    setCurrentStep('Checkout');
  }, []);

  const handlePaymentComplete = useCallback((id: string) => {
    setPaymentId(id);
    setCurrentStep('Confirmation');
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep('Products');
    setCart([]);
    setSessionData(null);
    setPaymentId(null);
  }, []);

  const handleFullReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStep('Products');
    setCart([]);
    setSessionData(null);
    setPaymentId(null);
    setConfigOpen(true);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasProgress = currentStep !== 'Products' || cart.length > 0 || sessionData !== null;

  return (
    <div className="min-h-screen bg-surface-950 font-sans text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-brand-500/[0.04] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse-soft" />
            <span className="text-xs font-medium text-brand-300">Interactive Tutorial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Build a Checkout with TagadaPay
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/40 max-w-lg mx-auto">
            Set up a store, browse products, pay — and learn the SDK hooks at every step. Powered by{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-brand-300">
              @tagadapay/headless-sdk/react
            </code>
          </p>
        </header>

        {/* Session controls */}
        {hasProgress && (
          <div className="mb-6 flex items-center justify-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
              <span className="text-[11px] text-white/35">Session restored</span>
            </div>
            <button
              onClick={handleFullReset}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/35 transition-colors hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Reset demo
            </button>
          </div>
        )}

        {/* Getting Started */}
        <GettingStarted
          config={config}
          onChange={setConfig}
          isOpen={configOpen}
          onToggle={() => setConfigOpen(!configOpen)}
        />

        {isConfigured ? (
          <TagadaHeadlessProvider storeId={config.storeId} environment={config.environment}>
            <div className="mt-8 space-y-8 animate-slide-up">
              <StepIndicator steps={[...STEPS]} current={currentStep} />

              {currentStep === 'Products' && (
                <ProductGrid
                  cart={cart}
                  onAddToCart={addToCart}
                  onGoToCart={() => goTo('Cart')}
                  cartCount={cartCount}
                  storeId={config.storeId}
                />
              )}

              {currentStep === 'Cart' && (
                <CartDrawer
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  onBack={() => goTo('Products')}
                  onSessionCreated={handleSessionCreated}
                />
              )}

              {currentStep === 'Checkout' && sessionData && (
                <CheckoutStep
                  checkoutToken={sessionData.checkoutToken}
                  sessionToken={sessionData.sessionToken}
                  onBack={() => goTo('Cart')}
                  onContinue={() => goTo('Payment')}
                />
              )}

              {currentStep === 'Payment' && sessionData && (
                <PaymentStep
                  checkoutToken={sessionData.checkoutToken}
                  sessionToken={sessionData.sessionToken}
                  onBack={() => goTo('Checkout')}
                  onComplete={handlePaymentComplete}
                />
              )}

              {currentStep === 'Confirmation' && (
                <ConfirmationStep paymentId={paymentId} onReset={handleReset} />
              )}
            </div>
          </TagadaHeadlessProvider>
        ) : (
          <div className="mt-16 text-center animate-fade-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <svg className="h-7 w-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-white/40">
              Enter your Store ID above to browse products
            </p>
          </div>
        )}

        {/* What's Next */}
        <div className="mt-12">
          <WhatsNext />
        </div>

        <footer className="mt-16 border-t border-white/[0.06] pt-6 text-center">
          <p className="text-xs text-white/25">
            Built with @tagadapay/headless-sdk &middot; React + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
