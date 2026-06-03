"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

/**
 * Shows a success toast after a Google OAuth round-trip.
 *
 * The Google button can't toast on success itself — NextAuth performs a full
 * redirect, so the originating page unmounts. Instead the button sets a
 * `pendingGoogleAuth` flag in sessionStorage; this hook (mounted globally)
 * fires the confirmation once the session resolves authenticated, then clears
 * the flag. Failures are handled on /login via the `?error=` param.
 */
export function useGoogleAuthToast() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pendingGoogleAuth") !== "1") return;

    sessionStorage.removeItem("pendingGoogleAuth");
    toast.success("Signed in with Google");
  }, [status]);
}
