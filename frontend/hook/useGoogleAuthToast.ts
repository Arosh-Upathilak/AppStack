"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

/**
 * Finalizes a Google OAuth round-trip (success toast + role-aware redirect).
 *
 * The Google button can't toast or route on success itself — NextAuth performs
 * a full redirect to its callbackUrl, so the originating page unmounts and the
 * page-level useRoleRedirect never runs. Instead the button sets a
 * `pendingGoogleAuth` flag in sessionStorage; this hook (mounted globally via
 * GoogleAuthToastWrapper) fires once the session resolves authenticated:
 *   - shows the success toast, then
 *   - sends ADMIN users to /admin, matching credentials-login behaviour (#12).
 * Buyers/sellers stay on the button's callbackUrl ("/"). Failures are handled
 * on /login via the `?error=` param.
 */
export function useGoogleAuthToast() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pendingGoogleAuth") !== "1") return;

    sessionStorage.removeItem("pendingGoogleAuth");
    toast.success("Signed in with Google");

    const roles = ((session?.user as any)?.role ?? []) as string[];
    if (roles.includes("ADMIN")) {
      router.replace("/admin");
    }
  }, [status, session, router]);
}
