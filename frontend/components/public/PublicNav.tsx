'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`psite-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="psite-nav-inner">
        <Link href="/" className="psite-logo">
          <div className="psite-logo-mark">A</div>
          <span>AppStack</span>
        </Link>

        <div className="psite-nav-links">
          <Link href="#features">Platform</Link>
          <Link href="/marketplace">Marketplace</Link>
          <a href="#pricing">Pricing</a>
          <a href="#docs">Docs</a>
          <Link href="/about">Customers</Link>
        </div>

        <div className="psite-nav-cta">
          <Link href="/login" className="ps-login">Log in</Link>
          <Link href="/register" className="ps-btn ps-btn-primary">
            Get started <span className="ps-arrow">→</span>
          </Link>
        </div>

        <button
          className="pub-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ marginLeft: 'auto' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="pub-mobile-menu">
          <Link href="#features" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>Platform</Link>
          <Link href="/marketplace" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <a href="#pricing" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#docs" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>Docs</a>
          <Link href="/about" className="pub-mobile-link" onClick={() => setMenuOpen(false)}>Customers</Link>
          <div className="pub-mobile-auth">
            <Link href="/login" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Log in</Link>
            <Link href="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
