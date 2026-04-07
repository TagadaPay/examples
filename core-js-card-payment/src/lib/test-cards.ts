export type TestCardCategory = 'success' | '3ds-challenge' | '3ds-frictionless' | 'decline';

export interface TestCard {
  label: string;
  number: string;
  brand: string;
  category: TestCardCategory;
  note?: string;
}

export interface ProcessorTestCards {
  id: string;
  name: string;
  color: string;
  cards: TestCard[];
}

export const CATEGORY_CONFIG: Record<TestCardCategory, { label: string; color: string }> = {
  success:            { label: 'Success',          color: 'text-green-600' },
  '3ds-challenge':    { label: '3DS Challenge',    color: 'text-amber-600' },
  '3ds-frictionless': { label: '3DS Frictionless', color: 'text-blue-600'  },
  decline:            { label: 'Decline',          color: 'text-red-600'   },
};

export const PROCESSOR_TEST_CARDS: ProcessorTestCards[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    color: '#635bff',
    cards: [
      { label: 'Visa',                    number: '4242 4242 4242 4242', brand: 'visa',       category: 'success' },
      { label: 'Mastercard',              number: '5555 5555 5555 4444', brand: 'mastercard', category: 'success' },
      { label: '3DS2 — Challenge',        number: '4000 0000 0000 3220', brand: 'visa',       category: '3ds-challenge',    note: 'Always triggers 3DS2 challenge' },
      { label: '3DS2 — Required',         number: '4000 0027 6000 3184', brand: 'visa',       category: '3ds-challenge',    note: '3DS required by card' },
      { label: '3DS2 — Frictionless',     number: '4000 0000 0000 3063', brand: 'visa',       category: '3ds-frictionless', note: 'Authenticated without challenge' },
      { label: 'Decline — Generic',       number: '4000 0000 0000 0002', brand: 'visa',       category: 'decline' },
      { label: 'Decline — Insufficient',  number: '4000 0000 0000 9995', brand: 'visa',       category: 'decline',          note: 'insufficient_funds' },
      { label: 'Decline — Lost Card',     number: '4000 0000 0000 9987', brand: 'visa',       category: 'decline',          note: 'lost_card' },
    ],
  },
  {
    id: 'airwallex',
    name: 'Airwallex',
    color: '#0055ff',
    cards: [
      { label: 'Visa — Success',         number: '4012 0000 3333 0026', brand: 'visa',       category: 'success' },
      { label: 'Mastercard — Success',   number: '5436 0310 3060 6378', brand: 'mastercard', category: 'success' },
      { label: 'Visa — 3DS Challenge',   number: '4012 0000 3333 0042', brand: 'visa',       category: '3ds-challenge',    note: 'Triggers Radar + 3DS challenge' },
      { label: 'Decline',                number: '4000 0000 0000 0002', brand: 'visa',       category: 'decline' },
    ],
  },
];
