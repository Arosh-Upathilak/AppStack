import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { SellerStatus } from "@/types/next-auth";

/**
 * Strict check: user is logged in AND has the SELLER role.
 * Does NOT consider sellerStatus (PENDING/APPROVED/REJECTED).
 *
 * Use this for endpoints/pages that just need to know the user is in the
 * seller "track" — e.g. resubmitting a rejected application.
 */
export async function requireSeller() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!(session as any)?.user?.role?.includes("SELLER")) {
    redirect("/");
  }

  return session;
}

/**
 * Returns the session along with the user's sellerStatus.
 *
 * Redirect behavior:
 *  - Not logged in → /login
 *  - Logged in but no SELLER role → /buyer/become-seller
 *  - Otherwise returns { session, status }
 *
 * Callers (e.g. seller layout) inspect `status` to decide whether to render
 * the real dashboard or a PendingApprovalGate. We deliberately do NOT redirect
 * pending/rejected sellers away from /seller — they should stay on those URLs
 * and see the gate UI.
 */
export async function getSellerSessionWithStatus(): Promise<{
  session: Awaited<ReturnType<typeof getServerSession>>;
  status: SellerStatus | null;
}> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const roles = ((session as any)?.user?.role ?? []) as string[];
  if (!roles.includes("SELLER")) {
    redirect("/buyer/become-seller");
  }

  const status =
    ((session as any)?.user?.sellerStatus as SellerStatus | undefined) ?? null;

  return { session, status };
}
