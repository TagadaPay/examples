import { useState } from 'react';
import type { AppConfig } from '../App';
import type { Environment } from '@tagadapay/headless-sdk';

interface GettingStartedProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SEED_ITEMS = [
  'Sandbox processor (test mode)',
  'Payment flow with routing',
  '3 products (headphones, charger, subscription)',
  '2 upsell offers',
  'Checkout funnel',
  '.env file with your Store ID',
];

export function GettingStarted({ config, onChange, isOpen, onToggle }: GettingStartedProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [editing, setEditing] = useState(false);

  const isConnected = config.storeId.trim() !== '';

  const copySeed = () => {
    navigator.clipboard.writeText('pnpm seed <YOUR_API_KEY>');
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  return (
    <div className="card-dark overflow-hidden animate-slide-up">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/80">Getting Started</span>
          {isConnected && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
              Connected
            </span>
          )}
        </div>
        <svg className={`h-4 w-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.06] px-5 py-5 space-y-5">
          {/* Step 1 — API Key */}
          <div className="flex gap-3">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isConnected ? 'bg-brand-500 text-white' : 'border border-brand-400 bg-brand-500/20 text-brand-300'}`}>
              {isConnected ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              ) : '1'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80">Get your API key</p>
              <p className="mt-0.5 text-xs text-white/40">
                Go to{' '}
                <a href="https://app.tagadapay.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
                  app.tagadapay.com
                </a>
                {' '}&rarr; Settings &rarr; Access Tokens
              </p>
            </div>
          </div>

          {/* Step 2 — Seed */}
          <div className="flex gap-3">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isConnected ? 'bg-brand-500 text-white' : 'border border-white/10 bg-white/5 text-white/30'}`}>
              {isConnected ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              ) : '2'}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-medium text-white/80">Seed your demo store</p>
              <p className="text-xs text-white/40">Run this in your terminal to create a fully configured store in one command:</p>

              <div className="group relative">
                <pre className="code-block rounded-lg border border-white/[0.08] bg-surface-950/80 px-4 py-3 font-mono text-sm text-white/80 overflow-x-auto">
                  <span className="text-brand-300">pnpm</span> seed <span className="text-yellow-300/80">&lt;YOUR_API_KEY&gt;</span>
                </pre>
                <button
                  onClick={copySeed}
                  className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 p-1.5 text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
                  title="Copy command"
                >
                  {copiedSeed ? (
                    <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 transition-colors"
              >
                <svg className={`h-3 w-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                What does this create?
              </button>

              {showDetails && (
                <ul className="space-y-1 pl-1">
                  {SEED_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/35">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Step 3 — Connected / Manual input */}
          <div className="flex gap-3">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isConnected ? 'bg-brand-500 text-white' : 'border border-white/10 bg-white/5 text-white/30'}`}>
              {isConnected ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              ) : '3'}
            </div>
            <div className="flex-1 min-w-0">
              {isConnected && !editing ? (
                <div>
                  <p className="text-sm font-medium text-white/80">Store connected</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-brand-300">{config.storeId}</code>
                    <span className="text-xs text-white/25">&middot;</span>
                    <span className="text-xs text-white/40">{config.environment}</span>
                    <button onClick={() => setEditing(true)} className="ml-1 text-[11px] text-white/30 underline underline-offset-2 hover:text-white/50 transition-colors">
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">
                    {editing ? 'Update store' : 'Connect your store'}
                  </p>
                  <p className="text-xs text-white/40">
                    {editing ? 'Change your Store ID or environment.' : 'Or paste your Store ID manually if you already have one:'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={config.storeId}
                      onChange={(e) => onChange({ ...config, storeId: e.target.value })}
                      placeholder="store_xxxxxxxxx"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
                    />
                    <select
                      value={config.environment}
                      onChange={(e) => onChange({ ...config, environment: e.target.value as Environment })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
                    >
                      <option value="production">Production</option>
                      <option value="sandbox">Sandbox</option>
                    </select>
                  </div>
                  {editing && (
                    <button onClick={() => setEditing(false)} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Done
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Source link */}
          <div className="border-t border-white/[0.04] pt-3">
            <a
              href="https://github.com/TagadaPay/examples/tree/main/headless-react"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/25 hover:text-white/40 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              View source on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
