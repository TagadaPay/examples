const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR'] as const;

interface AmountInputProps {
  amount: number;
  currency: string;
  onAmountChange: (cents: number) => void;
  onCurrencyChange: (currency: string) => void;
}

export function AmountInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
}: AmountInputProps) {
  const dollars = (amount / 100).toFixed(2);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw) && raw >= 0) {
      onAmountChange(Math.round(raw * 100));
    } else if (e.target.value === '' || e.target.value === '0') {
      onAmountChange(0);
    }
  };

  return (
    <div>
      <label className="label">Amount</label>
      <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <div className="flex select-none items-center pl-3 pr-1 text-sm text-slate-400">$</div>
        <input
          type="number"
          value={dollars}
          onChange={handleAmountChange}
          step="0.01"
          min="0"
          className="flex-1 bg-transparent py-2 pr-2 font-mono text-sm text-slate-900 outline-none placeholder-slate-400"
        />
        <div className="h-full w-px bg-slate-200" />
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="cursor-pointer bg-transparent py-2 pl-2 pr-3 font-mono text-sm text-slate-600 outline-none transition-colors hover:text-slate-900"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c} className="bg-white">
              {c}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 font-mono text-[10px] text-slate-400">{amount} cents</p>
    </div>
  );
}
