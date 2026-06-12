import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import type { SellerStatus } from "@/types/next-auth";
import PendingApprovalGate from "@/components/seller/PendingApprovalGate";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Not logged in → /login; logged in without SELLER role → become a seller.
  if (!session) {
    redirect("/login");
  }

  const roles = (session.user?.role ?? []) as string[];
  if (!roles.includes("SELLER")) {
    redirect("/buyer/become-seller");
  }

  const status: SellerStatus | null = session.user?.sellerStatus ?? null;

  // Anything other than APPROVED → show the gate, don't render the dashboard.
  // We intentionally do NOT redirect — keep them on /seller/* URLs so refresh
  // and bookmark behavior is sane.
  if (status !== "APPROVED") {
    return <PendingApprovalGate status={status} />;
  }

  return <>{children}</>;
}
