export type { Product, Subscription, Invoice, Renewal } from '@/data/mock';

export interface Review {
  id: string;
  productId: string;
  author: string;
  role: string;
  rating: number;
  body: string;
  createdAt: string;
}
