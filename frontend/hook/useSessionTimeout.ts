"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 60 * 1000; // 1 minute

export function useSessionTimeout() {
  const { data: session, status, update } = useSession();

  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (status !== "authenticated" || !session) return;

    const updateActivity = async () => {
      const now = Date.now();

      // Prevent too many requests
      // Update only once every 5 minutes
      if (now - lastUpdateRef.current < 5 * 60 * 1000) {
        return;
      }

      lastUpdateRef.current = now;

      try {
        await update({
          activity: true,
        });
      } catch (err) {
        console.error("Session update failed", err);
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check session periodically
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/session");

        if (res.status === 401) {
          signOut({
            callbackUrl: "/login?expired=true",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });

      clearInterval(interval);
    };
  }, [session, status, update]);
}
