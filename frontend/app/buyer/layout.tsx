import DashboardChrome from '@/components/DashboardChrome';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome role="buyer">{children}</DashboardChrome>;
}
