"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function MetaPixel() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    const win = window as any;
    if (!win.fbq) {
      win.fbq = function (...args: any[]) {
        win.fbq.queue = win.fbq.queue || [];
        win.fbq.queue.push(args);
      };
      win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = true;
      win.fbq.version = "2.0";
      win.fbq.queue = [];

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      win.fbq("init", pixelId);
    }
  }, [pixelId]);

  // Track PageView on path changes
  useEffect(() => {
    if (!pixelId) return;
    const win = window as any;
    if (win.fbq) {
      win.fbq("track", "PageView");
    }
  }, [pathname, pixelId]);

  if (!pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
