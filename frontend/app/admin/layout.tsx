import { requireAdmin } from "@/utils/AdminAuth";
import DashboardChrome from "@/components/DashboardChrome";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <DashboardChrome role="admin">{children}</DashboardChrome>;
}