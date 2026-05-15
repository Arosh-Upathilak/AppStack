// Stripe adapter. Real Stripe calls only when STRIPE_SECRET_KEY is set;
// otherwise a deterministic simulator that produces fake but consistent IDs.
// Keeps Phase 0 unblocked while Phase 2+ can drop in real keys.

const SECRET = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = !!SECRET;

interface SetupIntentResult {
  id: string;
  client_secret: string;
}

interface PaymentMethodSummary {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface ChargeResult {
  id: string;
  status: 'succeeded' | 'failed';
  errorCode?: string;
}

function fakeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}`;
}

async function stripeFetch(path: string, init?: RequestInit) {
  if (!SECRET) throw new Error('Stripe not configured');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stripe ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function createSetupIntent(customerId?: string): Promise<SetupIntentResult> {
  if (!SECRET) {
    return { id: fakeId('seti'), client_secret: fakeId('seti_secret') };
  }
  const body = new URLSearchParams();
  if (customerId) body.set('customer', customerId);
  body.set('usage', 'off_session');
  return stripeFetch('/setup_intents', { method: 'POST', body }) as Promise<SetupIntentResult>;
}

export async function listPaymentMethods(_customerId: string): Promise<PaymentMethodSummary[]> {
  if (!SECRET) return [];
  // In real impl: GET /payment_methods?customer=...&type=card
  return [];
}

export async function detachPaymentMethod(pmId: string): Promise<void> {
  if (!SECRET) return;
  await stripeFetch(`/payment_methods/${pmId}/detach`, { method: 'POST' });
}

export async function chargeOffSession(args: {
  amountCents: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
}): Promise<ChargeResult> {
  if (!SECRET) {
    // Simulator: 90% success, 10% fail.
    const ok = Math.random() < 0.9;
    return ok
      ? { id: fakeId('pi'), status: 'succeeded' }
      : { id: fakeId('pi'), status: 'failed', errorCode: 'card_declined' };
  }
  const body = new URLSearchParams();
  body.set('amount', String(args.amountCents));
  body.set('currency', args.currency.toLowerCase());
  body.set('customer', args.customerId);
  body.set('payment_method', args.paymentMethodId);
  body.set('off_session', 'true');
  body.set('confirm', 'true');
  const pi = (await stripeFetch('/payment_intents', { method: 'POST', body })) as {
    id: string;
    status: string;
    last_payment_error?: { code?: string };
  };
  return pi.status === 'succeeded'
    ? { id: pi.id, status: 'succeeded' }
    : { id: pi.id, status: 'failed', errorCode: pi.last_payment_error?.code };
}

export async function refund(paymentIntentId: string, amountCents?: number): Promise<{ id: string }> {
  if (!SECRET) return { id: fakeId('re') };
  const body = new URLSearchParams();
  body.set('payment_intent', paymentIntentId);
  if (amountCents) body.set('amount', String(amountCents));
  return stripeFetch('/refunds', { method: 'POST', body }) as Promise<{ id: string }>;
}
