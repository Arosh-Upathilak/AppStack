import axios from 'axios';
import { SUBSCRIPTIONS } from '@/data/mock';
import { withMockFallback } from './demo';
import { userAuthorization } from '@/hook/userAuthorization';
import {
  addLocalSubscription,
  getLocalSubscriptions,
  updateLocalSubscriptionStatus,
} from './demoStore';
import type { Subscription, Invoice } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface NewSubscriptionInput {
  productId: string;
  productName: string;
  vendor: string;
  hue: string;
  category: string;
  plan: string;
  seats: number;
  /** 'mo' = monthly, 'yr' = annual */
  cycle: 'mo' | 'yr';
  /** total monthly price the buyer agreed to */
  price: number;
}

/** Format a date `days` in the future as e.g. "Dec 4". */
function renewDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format today as e.g. "Oct 24, 2026". */
function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Build the local Subscription + Invoice records for a checkout. */
function buildLocalRecords(input: NewSubscriptionInput): {
  subscription: Subscription;
  invoice: Invoice;
} {
  const id = `sub-${Date.now()}`;
  const subscription: Subscription = {
    id,
    name: input.productName,
    vendor: input.vendor,
    hue: input.hue,
    plan: input.plan,
    price: input.price,
    cycle: input.cycle,
    seats: `${input.seats}/${input.seats}`,
    renew: renewDate(input.cycle === 'yr' ? 365 : 30),
    status: 'active',
    usage: 0,
    category: input.category,
  };
  const invoice: Invoice = {
    id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: todayLabel(),
    product: `${input.productName} · ${input.plan}`,
    amount: input.price,
    status: 'paid',
  };
  return { subscription, invoice };
}

/**
 * Create a subscription (checkout). Hits the (backend-owned) POST /subscriptions
 * endpoint, falling back to a synthesized record persisted in localStorage so the
 * subscribe → see-it-in-your-list demo works regardless of backend readiness.
 */
export async function createSubscription(
  input: NewSubscriptionInput,
): Promise<Subscription> {
  const local = buildLocalRecords(input);
  const { data, mocked } = await withMockFallback(
    async () => {
      const res = await axios.post(`${API_BASE}/subscriptions`, input, {
        headers: await userAuthorization(),
        withCredentials: true,
      });
      return (res.data?.subscription ?? res.data) as Subscription;
    },
    () => local.subscription,
    'POST /subscriptions',
  );
  if (mocked) addLocalSubscription(local.subscription, local.invoice);
  return data;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data, mocked } = await withMockFallback(
    async () => {
      const res = await axios.get(`${API_BASE}/subscriptions`, {
        headers: await userAuthorization(),
        withCredentials: true,
      });
      return (res.data?.subscriptions ?? res.data) as Subscription[];
    },
    () => SUBSCRIPTIONS,
    'GET /subscriptions',
  );
  return mocked ? [...getLocalSubscriptions(), ...data] : data;
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  const { data, mocked } = await withMockFallback(
    async () => {
      const res = await axios.get(`${API_BASE}/subscriptions/${id}`, {
        headers: await userAuthorization(),
        withCredentials: true,
      });
      return (res.data?.subscription ?? res.data) as Subscription;
    },
    () =>
      getLocalSubscriptions().find(s => s.id === id) ??
      SUBSCRIPTIONS.find(s => s.id === id),
    `GET /subscriptions/${id}`,
  );
  return data;
}

export async function cancelSubscription(id: string): Promise<{ ok: boolean }> {
  const { mocked } = await withMockFallback(
    async () => {
      await axios.post(
        `${API_BASE}/subscriptions/${id}/cancel`,
        {},
        { headers: await userAuthorization(), withCredentials: true },
      );
      return { ok: true };
    },
    () => ({ ok: true }),
    `POST /subscriptions/${id}/cancel`,
  );
  if (mocked) updateLocalSubscriptionStatus(id, 'attention');
  return { ok: true };
}

export async function upgradeSubscription(
  id: string,
  plan: string,
): Promise<{ ok: boolean }> {
  await withMockFallback(
    async () => {
      await axios.post(
        `${API_BASE}/subscriptions/${id}/upgrade`,
        { plan },
        { headers: await userAuthorization(), withCredentials: true },
      );
      return { ok: true };
    },
    () => ({ ok: true }),
    `POST /subscriptions/${id}/upgrade`,
  );
  return { ok: true };
}
