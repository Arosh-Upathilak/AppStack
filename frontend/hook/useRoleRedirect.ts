"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import type { AppRole } from "@/types/next-auth";

const LAST_ROLE_KEY = "appstack:lastRole";

/**
 * Route map for each role. Buyers go to /buyer (NOT /), which was the bug
 * in the previous implementation.
 */
const ROUTE_FOR_ROLE: Record<AppRole, string> = {
  ADMIN: "/admin",
  SELLER: "/seller",
  BUYER: "/buyer",
};

/**
 * Picks where to send an authenticated user.
 *
 * Order:
 *  1. If they have a sticky `lastRole` in localStorage AND they still have that
 *     role on their account AND (if SELLER) they're approved — go there.
 *  2. Otherwise fall back to the priority list ADMIN > SELLER (approved) > BUYER.
 *
 * A SELLER whose `sellerStatus !== APPROVED` is still allowed to land on
 * `/seller` so they see the pending-approval gate; we just don't *prefer*
 * that destination over a buyer dashboard they actually have access to.
 */
function pickDestination(
  roles: AppRole[],
  sellerStatus: string | null | undefined,
  lastRole: AppRole | null,
): string {
  const hasRole = (r: AppRole) => roles.includes(r);
  const sellerApproved = hasRole("SELLER") && sellerStatus === "APPROVED";

  // Sticky preference
  if (lastRole && hasRole(lastRole)) {
    if (lastRole === "SELLER" && !sellerApproved) {
      // fall through to fallback ordering
    } else {
      return ROUTE_FOR_ROLE[lastRole];
    }
  }

  // Priority fallback
  if (hasRole("ADMIN")) return ROUTE_FOR_ROLE.ADMIN;
  if (sellerApproved) return ROUTE_FOR_ROLE.SELLER;
  if (hasRole("BUYER")) return ROUTE_FOR_ROLE.BUYER;

  // A user with only SELLER (not approved) and nothing else still needs
  // somewhere to go. Send them to /seller so the pending gate shows.
  if (hasRole("SELLER")) return ROUTE_FOR_ROLE.SELLER;

  // No known role — punt to public home.
  return "/";
}

export function useRoleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Session expired toast (set by sign-out redirect with ?expired=true)
    const expired = searchParams.get("expired") === "true";
    if (expired) {
      toast.error("Your session has expired. Please log in again.");
    }

    if (status !== "authenticated" || !session?.user) return;

    const roles = (session.user.role ?? []) as AppRole[];
    const sellerStatus = session.user.sellerStatus ?? null;

    const lastRole =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(LAST_ROLE_KEY) as AppRole | null)
        : null;

    const dest = pickDestination(roles, sellerStatus, lastRole);
    router.replace(dest);
  }, [status, session, router, searchParams]);
}
