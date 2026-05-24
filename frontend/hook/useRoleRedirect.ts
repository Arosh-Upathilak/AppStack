"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export function useRoleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session, status } = useSession();

  useEffect(() => {
    // Session expired message
    const expired = searchParams.get("expired") === "true";

    if (expired) {
      toast.error("Your session has expired. Please log in again.");
    }

    // Redirect authenticated users
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;

      if (role?.includes("ADMIN")) {
        router.replace("/admin");
      } else if (role?.includes("SELLER")) {
        router.replace("/seller");
      } else {
        router.replace("/");
      }
    }
  }, [status, session, router, searchParams]);
}