import type { AppConfig } from '../App';
import type { Environment } from '@tagadapay/headless-sdk';

interface ConfigPanelProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ConfigPanel({ config, onChange, isOpen, onToggle }: ConfigPanelProps) {
  return (
    <div className="card-dark overflow-hidden animate-slide-up">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/80">Store Configuration</span>
        </div>
        <svg className={`h-4 w-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.06] px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Store ID</label>
              <input
                type="text"
                value={config.storeId}
                onChange={(e) => onChange({ ...config, storeId: e.target.value })}
                placeholder="store_xxxxxxxxx"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Environment</label>
              <select
                value={config.environment}
                onChange={(e) => onChange({ ...config, environment: e.target.value as Environment })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </div>
          </div>

          {config.storeId && (
            <div className="mt-4 rounded-lg border border-green-500/10 bg-green-500/5 p-3">
              <p className="text-xs text-green-400">
                Connected to <code className="font-mono">{config.storeId}</code>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
