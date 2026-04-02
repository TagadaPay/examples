import { useState, useCallback } from 'react';
import { TagadaHeadlessProvider } from '@tagadapay/headless-sdk/react';
import type { Environment } from '@tagadapay/headless-sdk';
import { ConfigPanel } from './components/ConfigPanel';
import { StepIndicator } from './components/StepIndicator';
import { ProductStep } from './components/ProductStep';
import { CheckoutStep } from './components/CheckoutStep';
import { PaymentStep } from './components/PaymentStep';
import { ConfirmationStep } from './components/ConfirmationStep';

export interface AppConfig {
  storeId: string;
  environment: Environment;
  apiKey: string;
  checkoutToken: string;
}

const STEPS = ['Product', 'Checkout', 'Payment', 'Confirmation'] as const;
export type Step = (typeof STEPS)[number];

function App() {
  const [config, setConfig] = useState<AppConfig>({
    storeId: '',
    environment: 'production',
    apiKey: '',
    checkoutToken: '',
  });

  const [currentStep, setCurrentStep] = useState<Step>('Product');
  const [configOpen, setConfigOpen] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const isConfigured = config.storeId.trim() !== '' && config.checkoutToken.trim() !== '';

  const goTo = useCallback((step: Step) => setCurrentStep(step), []);

  const handlePaymentComplete = useCallback((id: string) => {
    setPaymentId(id);
    setCurrentStep('Confirmation');
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep('Product');
    setPaymentId(null);
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 font-sans text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-brand-500/[0.04] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse-soft" />
            <span className="text-xs font-medium text-brand-300">Headless SDK</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              TagadaPay React Checkout
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/40 max-w-lg mx-auto">
            Full checkout experience built with{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-brand-300">
              @tagadapay/headless-sdk/react
            </code>
          </p>
        </header>

        {/* Config Panel */}
        <ConfigPanel
          config={config}
          onChange={setConfig}
          isOpen={configOpen}
          onToggle={() => setConfigOpen(!configOpen)}
        />

        {/* Content */}
        {isConfigured ? (
          <TagadaHeadlessProvider
            storeId={config.storeId}
            environment={config.environment}
            apiKey={config.apiKey || undefined}
          >
            <div className="mt-8 space-y-8 animate-slide-up">
              <StepIndicator steps={[...STEPS]} current={currentStep} />

              {currentStep === 'Product' && (
                <ProductStep onContinue={() => goTo('Checkout')} />
              )}

              {currentStep === 'Checkout' && (
                <CheckoutStep
                  checkoutToken={config.checkoutToken}
                  onBack={() => goTo('Product')}
                  onContinue={() => goTo('Payment')}
                />
              )}

              {currentStep === 'Payment' && (
                <PaymentStep
                  checkoutToken={config.checkoutToken}
                  onBack={() => goTo('Checkout')}
                  onComplete={handlePaymentComplete}
                />
              )}

              {currentStep === 'Confirmation' && (
                <ConfirmationStep
                  paymentId={paymentId}
                  onReset={handleReset}
                />
              )}
            </div>
          </TagadaHeadlessProvider>
        ) : (
          <div className="mt-16 text-center animate-fade-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <svg className="h-7 w-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-white/40">
              Configure your Store ID and Checkout Token above to get started
            </p>
          </div>
        )}

        {/* Footer */}
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
