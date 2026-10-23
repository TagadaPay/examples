import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface JsonViewerProps {
  data: unknown;
  title?: string;
  maxHeight?: string;
  defaultCollapsed?: boolean;
}

export function JsonViewer({
  data,
  title,
  maxHeight = '320px',
  defaultCollapsed = false,
}: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            {title}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      {!collapsed && (
        <div className="overflow-auto p-3" style={{ maxHeight }}>
          <pre className="font-mono text-xs leading-relaxed text-slate-700">
            <code>{jsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
