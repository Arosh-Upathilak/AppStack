"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Icon from "./Icon";
import type { AppRole, SellerStatus } from "@/types/next-auth";

const LAST_ROLE_KEY = "appstack:lastRole";

const ROUTE_FOR_ROLE: Record<AppRole, string> = {
  ADMIN: "/admin",
  SELLER: "/seller",
  BUYER: "/buyer",
};

const LABEL_FOR_ROLE: Record<AppRole, string> = {
  ADMIN: "Admin",
  SELLER: "Seller",
  BUYER: "Buyer",
};

/**
 * Header dropdown for users with multiple roles. Hides itself entirely if the
 * user only has one role.
 *
 * Behavior:
 *  - The "current" role is inferred from the URL path (/buyer/* → BUYER, etc).
 *  - Clicking a role routes to that role's root and writes the choice to
 *    localStorage so useRoleRedirect can honor it on next login.
 *  - SELLER is disabled (with a tooltip) when sellerStatus !== APPROVED.
 */
export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const roles = ((session?.user as any)?.role ?? []) as AppRole[];
  const sellerStatus =
    ((session?.user as any)?.sellerStatus as SellerStatus | null | undefined) ??
    null;

  if (!roles || roles.length < 2) return null;

  // Infer current role from URL
  let current: AppRole | null = null;
  if (pathname.startsWith("/admin")) current = "ADMIN";
  else if (pathname.startsWith("/seller")) current = "SELLER";
  else if (pathname.startsWith("/buyer")) current = "BUYER";

  // Display order (matches priority elsewhere)
  const order: AppRole[] = ["ADMIN", "SELLER", "BUYER"];
  const visible = order.filter((r) => roles.includes(r));

  const choose = (role: AppRole) => {
    setOpen(false);
    if (role === current) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_ROLE_KEY, role);
    }
    router.push(ROUTE_FOR_ROLE[role]);
  };

  const currentLabel = current ? LABEL_FOR_ROLE[current] : "Switch role";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="tb-icon-btn"
        title="Switch role"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          width: "auto",
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--ink-1)",
        }}
      >
        <Icon name="refresh" size={14} />
        <span>{currentLabel}</span>
        <Icon name="chevron_down" size={12} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 200,
            background: "var(--surface, #fff)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 6,
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              padding: "6px 10px 4px",
            }}
          >
            Switch role
          </div>
          {visible.map((r) => {
            const disabled =
              r === "SELLER" && sellerStatus !== "APPROVED";
            const isCurrent = r === current;
            return (
              <button
                key={r}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => choose(r)}
                title={
                  disabled
                    ? "Seller access is pending administrator approval"
                    : undefined
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  background: isCurrent
                    ? "var(--brand-soft)"
                    : "transparent",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  textAlign: "left",
                  color: disabled ? "var(--ink-4)" : "var(--ink-1)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: isCurrent
                      ? "var(--brand)"
                      : "var(--surface-pressed, #f3f4f6)",
                    color: isCurrent ? "#fff" : "var(--ink-2)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {r.charAt(0)}
                </span>
                <span style={{ flex: 1 }}>{LABEL_FOR_ROLE[r]}</span>
                {disabled && (
                  <span
                    style={{
                      fontSize: 10.5,
                      color: "var(--warning, #b45309)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Pending
                  </span>
                )}
                {isCurrent && !disabled && (
                  <Icon
                    name="check"
                    size={13}
                    style={{ color: "var(--brand)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
