"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";

/**
 * Surfaces a toast when a user is bounced off an area they can't access.
 *
 * Role guards run server-side (e.g. requireAdmin) and can only `redirect()` —
 * they can't toast. They instead redirect to `/?denied=<area>`; this component
 * (mounted globally) reads the flag once on the landing page, shows the toast,
 * then strips the param so a refresh doesn't replay it.
 */
const MESSAGES: Record<string, string> = {
  admin: "You don't have access to the admin area.",
  seller: "You don't have access to the seller area.",
};

export default function AccessDeniedToast() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const denied = params.get("denied");
    if (!denied || !MESSAGES[denied]) return;

    toast.error(MESSAGES[denied]);

    params.delete("denied");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  return null;
}
