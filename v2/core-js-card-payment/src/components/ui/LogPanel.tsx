import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Clock, ArrowRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import type { LogItem } from '@/hooks/usePaymentLogger';

const TYPE_CONFIG = {
  request:  { color: 'text-blue-600',  bg: 'bg-blue-50',   icon: ArrowRight   },
  response: { color: 'text-green-600', bg: 'bg-green-50',  icon: CheckCircle2 },
  event:    { color: 'text-amber-600', bg: 'bg-amber-50',  icon: Clock        },
  error:    { color: 'text-red-600',   bg: 'bg-red-50',    icon: AlertCircle  },
} as const;

function LogEntry({ log }: { log: LogItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[log.type];
  const Icon = cfg.icon;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
      >
        {expanded
          ? <ChevronDown size={10} className="shrink-0 text-slate-400" />
          : <ChevronRight size={10} className="shrink-0 text-slate-400" />}

        <div className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 ${cfg.bg}`}>
          <Icon size={10} className={cfg.color} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{log.type}</span>
        </div>

        <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{log.title}</span>

        {log.status !== undefined && (
          <span className={`shrink-0 font-mono text-[10px] ${
            log.status >= 200 && log.status < 300 ? 'text-green-600' : 'text-red-500'
          }`}>
            {log.status}
          </span>
        )}
        {log.duration !== undefined && (
          <span className="shrink-0 font-mono text-[10px] text-slate-400">{log.duration}ms</span>
        )}
        <span className="shrink-0 font-mono text-[10px] text-slate-400">
          {log.timestamp.toLocaleTimeString()}
        </span>
      </button>

      {expanded && log.data !== undefined && (
        <div className="border-t border-slate-100 bg-slate-50 p-3">
          <pre className="overflow-auto font-mono text-[11px] leading-relaxed text-slate-600">
            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

interface LogPanelProps {
  logs: LogItem[];
  title?: string;
  maxHeight?: string;
}

export function LogPanel({ logs, title = 'Request Log', maxHeight = '380px' }: LogPanelProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-xs text-slate-400">No activity yet — make a payment to see logs here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <span className="font-mono text-[10px] text-slate-400">{logs.length} entries</span>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
