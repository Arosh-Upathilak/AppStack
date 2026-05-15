import { INVOICES } from '@/data/mock';
import { delay } from './client';
import type { Invoice } from './types';

export async function listInvoices(): Promise<Invoice[]> {
  return delay(INVOICES);
}

export async function downloadInvoice(_id: string): Promise<{ url: string }> {
  return delay({ url: '#' });
}
