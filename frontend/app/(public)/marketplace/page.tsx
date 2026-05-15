import type { Metadata } from 'next';
import Marketplace from '@/screens/Marketplace';

export const metadata: Metadata = {
  title: 'Marketplace · AppStack — Discover SaaS products',
  description: 'Browse 248+ verified SaaS products. Filter by category, compare plans, and subscribe in minutes — all managed from your AppStack dashboard.',
};

export default function PublicMarketplacePage() {
  return <Marketplace mode="public" />;
}
