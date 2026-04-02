import type { AppConfig } from '../App';
import type { Environment } from '@tagadapay/headless-sdk';

interface Props {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ConfigPanel({ config, onChange, isOpen, onToggle }: Props) {
  const update = (patch: Partial<AppConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="card-dark animate-slide-up">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
            <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">Configuration</h2>
            <p className="text-xs text-white/30">
              {config.storeId ? `${config.storeId} · ${config.environment}` : 'Set up your store connection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.storeId && config.checkoutToken && (
            <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Connected
            </span>
          )}
          <svg
            className={`h-4 w-4 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 animate-slide-down">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Store ID</label>
            <input
              type="text"
              value={config.storeId}
              onChange={(e) => update({ storeId: e.target.value })}
              className="input-dark"
              placeholder="store_abc123"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Environment</label>
            <select
              value={config.environment}
              onChange={(e) => update({ environment: e.target.value as Environment })}
              className="input-dark appearance-none"
            >
              <option value="production">Production</option>
              <option value="development">Development</option>
              <option value="local">Local</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-white/40">Checkout Token</label>
            <input
              type="text"
              value={config.checkoutToken}
              onChange={(e) => update({ checkoutToken: e.target.value })}
              className="input-dark font-mono"
              placeholder="chk_..."
            />
            <p className="mt-1 text-xs text-white/20">
              The checkout token from your TagadaPay dashboard or API
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-white/40">API Key (optional)</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              className="input-dark"
              placeholder="tgd_pk_..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
