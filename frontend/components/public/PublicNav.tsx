"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function PublicNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: session }: any = useSession();
  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  return (
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
            <div>
              <Link href="/login" className="ps-login ">
                Log in
              </Link>
              <Link href="/register" className="ps-btn ps-btn-primary">
                Get started <span className="ps-arrow">→</span>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4">
              <p>{session.user?.email}</p>
              <button
                type="button"
                onClick={() => handleLogout()}
                className="ps-btn ps-btn-primary"
              >
                Logout
              </button>
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
          <Link
            href="/#features"
            className="pub-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            Platform
          </Link>
          <Link
            href="/marketplace"
            className="pub-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            Marketplace
          </Link>
          <Link
            href="/about"
            className="pub-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
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
        </div>
      )}
    </nav>
  );
}
