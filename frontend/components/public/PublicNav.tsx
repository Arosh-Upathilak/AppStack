"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-toastify";
import type { AppRole } from "@/types/next-auth";
import UserMenu from "./UserMenu";
import SideNav from "./SideNav";

export default function PublicNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [sideNavOpen, setSideNavOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: session } = useSession();
  const user = session?.user;
  const roles = (user?.role ?? []) as AppRole[];
  const userInitials = initials(user?.name, user?.email);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setSideNavOpen(false);
    toast.success("Logged out successfully");
    signOut({ callbackUrl: "/" });
  };

  const openSideNav = () => {
    setUserMenuOpen(false);
    setSideNavOpen(true);
  };

  return (
    <>
    <nav className={`psite-nav${scrolled ? " scrolled" : ""}`}>
      <div className="psite-nav-inner">
        <Link href="/" className="psite-logo">
          <div className="psite-logo-mark">A</div>
          <span>AppStack</span>
        </Link>

        <div className="psite-nav-links">
          <Link href="/#features">Platform</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/about">About</Link>
        </div>

        <div className="psite-nav-cta">
          {!session ? (
            <div className="flex items-center gap-5">
              <Link href="/login" className="ps-login">
                Log in
              </Link>
              <Link href="/register" className="ps-btn ps-btn-primary">
                Get started <span className="ps-arrow">→</span>
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 rounded-pill border border-line bg-surface py-1 pl-1 pr-3 shadow-sm transition-all hover:border-line-strong hover:shadow-md"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-pill text-xs font-semibold text-white"
                  style={{ background: "radial-gradient(120% 100% at 20% 20%, #4a7bd6 0%, #003d9b 55%, #021440 100%)" }}
                >
                  {userInitials}
                </span>
                <span className="max-w-[140px] truncate text-sm font-medium text-ink-1">
                  {user?.name || user?.email}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-ink-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <UserMenu
                  name={user?.name}
                  email={user?.email}
                  roles={roles}
                  initials={userInitials}
                  onOpenNav={openSideNav}
                  onLogout={handleLogout}
                  onClose={() => setUserMenuOpen(false)}
                />
              )}
            </div>
          )}
        </div>

        <button
          className="pub-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ marginLeft: "auto" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="pub-mobile-menu">
          <Link href="/#features" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>
            Platform
          </Link>
          <Link href="/marketplace" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>
            Marketplace
          </Link>
          <Link href="/about" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          {!session ? (
            <div className="pub-mobile-auth">
              <Link
                href="/login"
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Get started
              </Link>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ justifyContent: "center", marginTop: 8 }}
              onClick={() => {
                setMenuOpen(false);
                setSideNavOpen(true);
              }}
            >
              Menu &amp; dashboards
            </button>
          )}
        </div>
      )}

    </nav>
    {session && <SideNav open={sideNavOpen} onClose={() => setSideNavOpen(false)} />}
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
