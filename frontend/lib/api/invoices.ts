import axios from 'axios';
import { INVOICES } from '@/data/mock';
import { delay } from './client';
import { withMockFallback } from './demo';
import { userAuthorization } from '@/hook/userAuthorization';
import { getLocalInvoices } from './demoStore';
import type { Invoice } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function listInvoices(): Promise<Invoice[]> {
  const { data, mocked } = await withMockFallback(
    async () => {
      const res = await axios.get(`${API_BASE}/invoices`, {
        headers: await userAuthorization(),
        withCredentials: true,
      });
      return (res.data?.invoices ?? res.data) as Invoice[];
    },
    () => INVOICES,
    'GET /invoices',
  );
  return mocked ? [...getLocalInvoices(), ...data] : data;
}

export async function downloadInvoice(_id: string): Promise<{ url: string }> {
  return delay({ url: '#' });
}
