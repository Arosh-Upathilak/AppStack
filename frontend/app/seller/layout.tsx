import DashboardChrome from '@/components/DashboardChrome';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome role="seller">{children}</DashboardChrome>;
}
