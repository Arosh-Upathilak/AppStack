/**
 * In-memory billing store for the demo.
 *
 * Payment processing and consent tracking are not implemented in the backend
 * (the backend only does auth + seller approval + notifications). These mock
 * stores back the `/api/payment-methods` and `/api/consents` routes so the
 * buyer Settings tabs render real-feeling data. State lives for the lifetime of
 * the server process — adding/removing cards works within a session.
 */

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isPrimary: boolean;
}

export interface ConsentRecord {
  id: string;
  type: string;
  agreedAt: string;
  ipAddress: string | null;
  product: string;
  plan: string;
  recipientEmail: string;
}

let methods: PaymentMethod[] = [
  { id: 'pm_demo_visa', brand: 'Visa', last4: '4242', expMonth: 8, expYear: 2028, isPrimary: true },
];

const consents: ConsentRecord[] = [
  {
    id: 'cs_demo_1',
    type: 'SHARE_EMAIL',
    agreedAt: '2026-05-21T10:14:00.000Z',
    ipAddress: '203.0.113.42',
    product: 'CloudSync Pro',
    plan: 'Professional',
    recipientEmail: 'billing@datatech.example',
  },
];

let seq = 1;

function brandFromNumber(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6/.test(digits)) return 'Discover';
  return 'Card';
}

/** Standard Luhn check so the simulator rejects obviously fake numbers. */
export function luhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function listMethods(): PaymentMethod[] {
  return methods;
}

export function addMethod(input: {
  number: string;
  expMonth: number;
  expYear: number;
  setAsPrimary?: boolean;
}): PaymentMethod {
  const digits = input.number.replace(/\D/g, '');
  const makePrimary = input.setAsPrimary || methods.length === 0;
  if (makePrimary) methods = methods.map(m => ({ ...m, isPrimary: false }));
  const method: PaymentMethod = {
    id: `pm_${Date.now()}_${seq++}`,
    brand: brandFromNumber(digits),
    last4: digits.slice(-4),
    expMonth: input.expMonth,
    expYear: input.expYear,
    isPrimary: makePrimary,
  };
  methods = [...methods, method];
  return method;
}

export function removeMethod(id: string): void {
  const removed = methods.find(m => m.id === id);
  methods = methods.filter(m => m.id !== id);
  // If we removed the primary, promote the first remaining card.
  if (removed?.isPrimary && methods.length > 0 && !methods.some(m => m.isPrimary)) {
    methods = methods.map((m, i) => (i === 0 ? { ...m, isPrimary: true } : m));
  }
}

export function setPrimary(id: string): void {
  methods = methods.map(m => ({ ...m, isPrimary: m.id === id }));
}

export function listConsents(): ConsentRecord[] {
  return consents;
}
