import { SUBSCRIPTIONS } from '@/data/mock';
import { delay } from './client';
import type { Subscription } from './types';

export async function listSubscriptions(): Promise<Subscription[]> {
  return delay(SUBSCRIPTIONS);
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  return delay(SUBSCRIPTIONS.find(s => s.id === id));
}

export async function cancelSubscription(_id: string): Promise<{ ok: boolean }> {
  return delay({ ok: true });
}

export async function upgradeSubscription(_id: string, _plan: string): Promise<{ ok: boolean }> {
  return delay({ ok: true });
}
