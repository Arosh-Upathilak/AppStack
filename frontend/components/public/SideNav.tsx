"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import type { AppRole, SellerStatus } from "@/types/next-auth";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

type NavLink = {
  href: string;
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  highlight?: boolean;
  badge?: string;
};

/**
 * Slide-in drawer for authenticated users on the public site. Surfaces the
 * role-appropriate destinations (dashboards + Become-a-Seller) without forcing
 * the user off the main page. Built in Tailwind.
 */
export default function SideNav({ open, onClose }: SideNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const roles = (user?.role ?? []) as AppRole[];
  const sellerStatus = (user?.sellerStatus ?? null) as SellerStatus | null;

  const isAdmin = roles.includes("ADMIN");
  const isSeller = roles.includes("SELLER");
  const sellerApproved = isSeller && sellerStatus === "APPROVED";

  const links: NavLink[] = [];
  if (isAdmin) {
    links.push({ href: "/admin", label: "Admin panel", icon: "shield" });
  }
  if (isSeller) {
    links.push({
      href: "/seller",
      label: "Seller dashboard",
      icon: "package",
      badge: sellerApproved ? undefined : "Pending",
    });
  }
  // Everyone is a buyer in the unified-identity model.
  links.push({ href: "/buyer", label: "Buyer dashboard", icon: "home" });
  if (!isSeller) {
    links.push({
      href: "/buyer/become-seller",
      label: "Become a Seller",
      icon: "rocket",
      highlight: true,
    });
  }
  links.push({ href: "/buyer/settings", label: "Account settings", icon: "settings" });

  const handleLogout = () => {
    toast.success("Logout successful!");
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-[rgba(10,19,48,0.4)] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-[300px] max-w-[85vw] flex-col bg-surface shadow-lg transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Account menu"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-pill text-sm font-semibold text-white shadow-sm"
            style={{ background: "radial-gradient(120% 100% at 20% 20%, #4a7bd6 0%, #003d9b 55%, #021440 100%)" }}
          >
            {initials(user?.name, user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink-1">
              {user?.name || "Your account"}
            </div>
            <div className="truncate text-xs text-ink-4">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-ink-3 hover:bg-surface-hover"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Role badges */}
        <div className="flex flex-wrap gap-1.5 px-5 pt-4">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-pill bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand"
            >
              {r.toLowerCase()}
            </span>
          ))}
        </div>

        {/* Links */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                l.highlight
                  ? "text-brand hover:bg-brand-soft"
                  : "text-ink-2 hover:bg-surface-hover"
              }`}
            >
              <Icon name={l.icon} size={17} />
              <span className="flex-1">{l.label}</span>
              {l.badge && (
                <span className="rounded-pill bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                  {l.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <Icon name="logout" size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/** Compute up to two uppercase initials from a name, falling back to email. */
function initials(name?: string | null, email?: string | null): string {
  const src = (name || email || "").trim();
  if (!src) return "U";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
