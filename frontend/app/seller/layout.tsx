import { getSellerSessionWithStatus } from "@/utils/SellerAuth";
import PendingApprovalGate from "@/components/seller/PendingApprovalGate";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = await getSellerSessionWithStatus();

  // Anything other than APPROVED → show the gate, don't render the dashboard.
  // We intentionally do NOT redirect — keep them on /seller/* URLs so refresh
  // and bookmark behavior is sane.
  if (status !== "APPROVED") {
    return <PendingApprovalGate status={status} />;
  }

  return <>{children}</>;
}
