"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

/**
 * Post-login routing for the public auth pages (login / register).
 *
 * New flow (demo): authenticated users STAY on the main site. We no longer
 * bounce buyers off to a separate /buyer dashboard that looks nothing like the
 * landing page — they land on `/` and reach their dashboards / Become-a-Seller
 * via the avatar dropdown + side nav (see PublicNav, UserMenu, SideNav).
 *
 * This hook only fires on pages that render it (login, register): if a logged-in
 * user opens those, send them home.
 */
export function useRoleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    // Session expired toast (set by sign-out redirect with ?expired=true)
    if (searchParams.get("expired") === "true") {
      toast.error("Your session has expired. Please log in again.");
    }

    if (status !== "authenticated") return;

    router.replace("/");
  }, [status, router, searchParams]);
}
