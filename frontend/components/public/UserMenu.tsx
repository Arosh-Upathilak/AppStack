"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import type { AppRole } from "@/types/next-auth";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  roles: AppRole[];
  initials: string;
  onOpenNav: () => void;
  onLogout: () => void;
  onClose: () => void;
}

const AVATAR =
  "radial-gradient(120% 100% at 20% 20%, #4a7bd6 0%, #003d9b 55%, #021440 100%)";

/**
 * Dropdown panel shown when the logged-in user clicks their avatar in the
 * public navbar. Shows profile details and routes into the full side nav.
 */
export default function UserMenu({
  name,
  email,
  roles,
  initials,
  onOpenNav,
  onLogout,
  onClose,
}: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] z-[80] w-72 origin-top-right overflow-hidden rounded-xl border border-line bg-surface shadow-lg ring-1 ring-black/[0.02]"
      role="menu"
    >
      {/* Profile header */}
      <div className="flex items-center gap-3 px-4 pb-3.5 pt-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-[13px] font-semibold text-white shadow-sm"
          style={{ background: AVATAR }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-1">
            {name || "Your account"}
          </div>
          <div className="truncate text-xs text-ink-4">{email}</div>
        </div>
      </div>

      {roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-pill bg-brand-soft px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-brand"
            >
              {r.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-line-soft p-1.5">
        <button
          type="button"
          onClick={onOpenNav}
          role="menuitem"
          className="group flex w-full items-center gap-3 rounded-lg bg-transparent px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-brand-soft hover:text-brand"
        >
          <Icon name="menu" size={17} className="text-ink-4 group-hover:text-brand" />
          <span className="flex-1 text-left">Menu &amp; dashboards</span>
          <Icon name="chevron_right" size={15} className="text-ink-5 group-hover:text-brand" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          role="menuitem"
          className="group flex w-full items-center gap-3 rounded-lg bg-transparent px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Icon name="logout" size={17} className="text-ink-4 group-hover:text-danger" />
          <span className="text-left">Log out</span>
        </button>
      </div>
    </div>
  );
}
