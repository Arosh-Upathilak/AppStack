import type { Subscription, Invoice } from './types';

/**
 * Client-side persistence for locally-created subscriptions/invoices.
 *
 * When the backend subscribe endpoint isn't live yet, `createSubscription`
 * synthesizes the record and stores it here so the buyer's subscriptions and
 * invoices lists reflect the just-completed checkout across navigation. Once the
 * real backend responds (`mocked: false`), this overlay is ignored entirely.
 */

const SUBS_KEY = 'appstack.demo.subscriptions';
const INVOICES_KEY = 'appstack.demo.invoices';

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / serialization errors — demo persistence is best-effort */
  }
}

export function getLocalSubscriptions(): Subscription[] {
  return read<Subscription>(SUBS_KEY);
}

export function getLocalInvoices(): Invoice[] {
  return read<Invoice>(INVOICES_KEY);
}

export function addLocalSubscription(sub: Subscription, invoice: Invoice): void {
  write(SUBS_KEY, [sub, ...getLocalSubscriptions()]);
  write(INVOICES_KEY, [invoice, ...getLocalInvoices()]);
}

export function updateLocalSubscriptionStatus(
  id: string,
  status: Subscription['status'],
): void {
  const subs = getLocalSubscriptions().map(s => (s.id === id ? { ...s, status } : s));
  write(SUBS_KEY, subs);
}
