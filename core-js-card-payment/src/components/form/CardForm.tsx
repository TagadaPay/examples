import { useState } from 'react';
import { PROCESSOR_TEST_CARDS, CATEGORY_CONFIG } from '@/lib/test-cards';

export interface CardData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

interface CardFormProps {
  onSubmit: (data: CardData) => void;
  isLoading?: boolean;
  isInitialized?: boolean;
  error?: string | null;
  submitLabel?: string;
}

const CATEGORY_BADGE: Record<string, string> = {
  success:            'bg-green-100 text-green-700',
  '3ds-challenge':    'bg-amber-100 text-amber-700',
  '3ds-frictionless': 'bg-blue-100 text-blue-700',
  decline:            'bg-red-100 text-red-700',
};

export function CardForm({
  onSubmit,
  isLoading,
  isInitialized = true,
  error,
  submitLabel = 'Pay Now',
}: CardFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });

  const [selectedProcessorId, setSelectedProcessorId] = useState(PROCESSOR_TEST_CARDS[0].id);
  const [selectedCardNumber, setSelectedCardNumber] = useState('');

  const selectedProcessor = PROCESSOR_TEST_CARDS.find((p) => p.id === selectedProcessorId)!;
  const selectedCard = selectedProcessor.cards.find((c) => c.number === selectedCardNumber) ?? null;

  const handleProcessorChange = (processorId: string) => {
    setSelectedProcessorId(processorId);
    setSelectedCardNumber('');
  };

  const handleCardSelect = (cardNumber: string) => {
    setSelectedCardNumber(cardNumber);
    if (!cardNumber) return;
    const card = selectedProcessor.cards.find((c) => c.number === cardNumber);
    if (!card) return;
    setCardData((prev) => ({
      ...prev,
      cardNumber: card.number,
      expiryDate: prev.expiryDate || '12/34',
      cvc: prev.cvc || '123',
      cardholderName: prev.cardholderName || 'Test User',
    }));
  };

  const handleChange = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === 'cardNumber') {
      value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    if (field === 'cvc') value = value.replace(/\D/g, '');
    setCardData((prev) => ({ ...prev, [field]: value }));
  };


  return (
    <div className="space-y-4">
      {/* Test card picker */}
      <div className="space-y-2">
        <span className="label">Test Cards</span>

        {/* Processor tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {PROCESSOR_TEST_CARDS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProcessorChange(p.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedProcessorId === p.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Card dropdown */}
        <div className="relative">
          <select
            value={selectedCardNumber}
            onChange={(e) => handleCardSelect(e.target.value)}
            className="input-field appearance-none pr-8 text-sm"
          >
            <option value="">Select a test card…</option>
            {selectedProcessor.cards.map((card) => {
              const cat = CATEGORY_CONFIG[card.category];
              const last4 = card.number.replace(/\s/g, '').slice(-4);
              return (
                <option key={card.number} value={card.number}>
                  {card.label} (···{last4}) — {cat.label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Selected card badge */}
        {selectedCard && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE[selectedCard.category]}`}>
              {CATEGORY_CONFIG[selectedCard.category].label}
            </span>
            <span className="font-mono text-xs text-slate-500">{selectedCard.number}</span>
            {selectedCard.note && (
              <span className="ml-auto text-[10px] text-slate-400">{selectedCard.note}</span>
            )}
          </div>
        )}
      </div>

      {/* Inputs */}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(cardData); }} className="space-y-3">
        <div>
          <label className="label">Cardholder Name</label>
          <input
            type="text"
            value={cardData.cardholderName}
            onChange={handleChange('cardholderName')}
            className="input-field"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label className="label">Card Number</label>
          <input
            type="text"
            value={cardData.cardNumber}
            onChange={handleChange('cardNumber')}
            className="input-field-mono"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Expiry</label>
            <input
              type="text"
              value={cardData.expiryDate}
              onChange={handleChange('expiryDate')}
              className="input-field-mono"
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>
          <div>
            <label className="label">CVC</label>
            <input
              type="text"
              value={cardData.cvc}
              onChange={handleChange('cvc')}
              className="input-field-mono"
              placeholder="123"
              maxLength={4}
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {!isInitialized && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Initializing payment processor...
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isInitialized}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  );
}
