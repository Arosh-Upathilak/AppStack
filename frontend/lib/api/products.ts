import { PRODUCTS, CATEGORIES } from '@/data/mock';
import { delay } from './client';
import type { Product } from './types';
import type { Review } from './types';

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', productId: 'cloudsync-pro', author: 'Sarah Jenkins', role: 'VP of Sales · TechCorp', rating: 5, body: 'Transformed our sales pipeline visibility. The unified dashboard gives our exec team exactly what they need without digging through reports.', createdAt: '2024-10-01' },
  { id: 'r2', productId: 'cloudsync-pro', author: 'Marcus Rivera', role: 'CTO · LogisticsPro', rating: 5, body: 'Migration was smoother than expected. The API documentation is stellar, making it easy to integrate with our existing ERP.', createdAt: '2024-09-15' },
  { id: 'r3', productId: 'cloudsync-pro', author: 'Priya Shah', role: 'Head of Ops · Atlas Retail', rating: 4, body: 'Onboarding was fast — we were running automations in production within a week. The pricing felt fair for the value delivered.', createdAt: '2024-08-20' },
  { id: 'r4', productId: 'flexaro-crm', author: 'David Kim', role: 'Director of Growth · Nexus', rating: 5, body: 'Best CRM we have used. The predictive analytics saved us weeks of manual forecasting every month.', createdAt: '2024-10-10' },
  { id: 'r5', productId: 'flexaro-crm', author: 'Emma Torres', role: 'Sales Manager · BuildCo', rating: 5, body: 'Setup took under an hour. Our whole sales team was onboarded by end of day. Support is incredibly responsive.', createdAt: '2024-09-28' },
  { id: 'r6', productId: 'secureguard', author: 'James O\'Brien', role: 'CISO · FinServe Ltd', rating: 5, body: 'Zero-trust implementation was exactly what our compliance team needed. SOC 2 audit passed with zero findings.', createdAt: '2024-10-05' },
  { id: 'r7', productId: 'teamsync-suite', author: 'Aisha Patel', role: 'People Ops Lead · Remote Inc', rating: 4, body: 'Unified comms across our distributed team. Video quality is excellent and the docs integration is seamless.', createdAt: '2024-09-10' },
  { id: 'r8', productId: 'metricsync', author: 'Lucas Chen', role: 'Growth Analyst · Hyper', rating: 4, body: 'Aggregating all our marketing data into one dashboard cut our reporting time by 70%. Worth every cent.', createdAt: '2024-10-02' },
];

interface ListProductsParams {
  category?: string;
  query?: string;
}

export async function listProducts(params?: ListProductsParams): Promise<Product[]> {
  let items = PRODUCTS;
  if (params?.category && params.category !== 'All') {
    items = items.filter(p => p.category === params.category);
  }
  if (params?.query) {
    const q = params.query.toLowerCase();
    items = items.filter(p =>
      p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
    );
  }
  return delay(items);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return delay(PRODUCTS.find(p => p.id === id));
}

export async function listCategories(): Promise<string[]> {
  return delay(CATEGORIES);
}

export async function listReviews(productId: string): Promise<Review[]> {
  return delay(MOCK_REVIEWS.filter(r => r.productId === productId));
}
