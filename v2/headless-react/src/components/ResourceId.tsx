import { useState } from 'react';

interface ResourceIdProps {
  label: string;
  value: string | null | undefined;
}

export function ResourceId({ label, value }: ResourceIdProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const truncated = value.length > 28 ? value.slice(0, 12) + '...' + value.slice(-8) : value;

  return (
    <button
      onClick={handleCopy}
      title={`${label}: ${value} — click to copy`}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 transition-colors hover:bg-white/[0.05] group"
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">{label}</span>
      <code className="font-mono text-[10px] text-white/45 group-hover:text-white/60 transition-colors">
        {copied ? 'copied!' : truncated}
      </code>
    </button>
  );
}

export function ResourceIdBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {children}
    </div>
  );
}
