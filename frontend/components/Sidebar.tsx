'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Icon from './Icon';
import type { AppRole, SellerStatus } from '@/types/next-auth';

interface SidebarProps {
  role: 'buyer' | 'seller' | 'admin';
}

interface NavItem {
  href: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  exact?: boolean;
  badge?: number;
}

const buyerNav: NavItem[] = [
  { href: '/buyer', label: 'Overview', icon: 'home', exact: true },
  { href: '/buyer/marketplace', label: 'Marketplace', icon: 'compass' },
  { href: '/buyer/subscriptions', label: 'Subscriptions', icon: 'box', badge: 12 },
  { href: '/buyer/invoices', label: 'Invoices', icon: 'receipt' },
  { href: '/buyer/settings', label: 'Settings', icon: 'settings' },
];

const sellerNav: NavItem[] = [
  { href: '/seller', label: 'Overview', icon: 'home', exact: true },
  { href: '/seller/products', label: 'Products', icon: 'package' },
  { href: '/seller/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/seller/wallet', label: 'Wallet', icon: 'wallet' },
  { href: '/seller/settings', label: 'Settings', icon: 'settings' },
];

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'home', exact: true },
  { href: '/admin/sellers/pending', label: 'Pending Sellers', icon: 'package' },
];

const PORTAL_LABEL: Record<SidebarProps['role'], string> = {
  buyer: 'Buyer Portal',
  seller: 'Seller Portal',
  admin: 'Admin Console',
};

/**
 * Sidebar CTA block. Renders one of:
 *  - "Become a Seller" (buyer who isn't yet a seller)
 *  - "Switch to Seller" (buyer who IS a seller — approval state is enforced
 *    when /seller actually loads)
 *  - "Switch to Buyer" (seller looking at the seller sidebar)
 * Hidden for admin context.
 */
function SellerCta({ context }: { context: 'buyer' | 'seller' | 'admin' }) {
  const { data: session } = useSession();
  if (context === 'admin') return null;

  const roles = ((session?.user as any)?.role ?? []) as AppRole[];
  const sellerStatus =
    ((session?.user as any)?.sellerStatus as SellerStatus | null | undefined) ?? null;

  const isSeller = roles.includes('SELLER');

  if (context === 'seller') {
    // On a seller page → always offer the switch back to buyer (every seller
    // is also a buyer in the unified-identity model).
    return (
      <>
        <div className="sb-section">Switch role</div>
        <Link href="/buyer" className="sb-link">
          <Icon name="refresh" size={14} />
          <span>Switch to Buyer</span>
        </Link>
      </>
    );
  }

  // context === 'buyer'
  if (!isSeller) {
    return (
      <>
        <div className="sb-section">Sell on AppStack</div>
        <Link
          href="/buyer/become-seller"
          className="sb-link"
          style={{ color: 'var(--brand)', fontWeight: 500 }}
        >
          <Icon name="package" size={14} />
          <span>Become a Seller</span>
        </Link>
      </>
    );
  }

  // Has SELLER role. Surface the switch — the seller layout itself enforces
  // the approval gate, so we don't need to gate the click here. We do flag
  // the pending state visually so the user isn't surprised.
  const pending = sellerStatus !== 'APPROVED';
  return (
    <>
      <div className="sb-section">Switch role</div>
      <Link href="/seller" className="sb-link">
        <Icon name="refresh" size={14} />
        <span>Switch to Seller</span>
        {pending && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              color: 'var(--warning, #b45309)',
            }}
          >
            Pending
          </span>
        )}
      </Link>
    </>
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const displayName =
    user?.name || user?.email?.split('@')[0] || 'Your account';
  const displayMeta = user?.email ?? '';
  const userInitials = sidebarInitials(user?.name, user?.email);
  const nav =
    role === 'seller' ? sellerNav : role === 'admin' ? adminNav : buyerNav;

  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const handleLogout = () => {
    setAccountOpen(false);
    toast.success('Logged out successfully');
    signOut({ callbackUrl: '/' });
  };

  const settingsHref = role === 'admin' ? null : `/${role}/settings`;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const primaryCta =
    role === 'buyer'
      ? { href: '/buyer/marketplace', label: 'New Subscription' }
      : role === 'seller'
      ? { href: '/seller/products', label: 'New Product' }
      : null; // admin: no primary CTA

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">A</div>
        <div>
          <div className="sb-brand-name">AppStack</div>
          <div className="sb-brand-meta">{PORTAL_LABEL[role]}</div>
        </div>
      </div>

      {primaryCta && (
        <Link
          href={primaryCta.href}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
        >
          <Icon name="plus" size={14} /> {primaryCta.label}
        </Link>
      )}

      <div className="sb-section">Workspace</div>
      {nav.map(item => (
        <Link key={item.href} href={item.href}
              className={`sb-link ${isActive(item) ? 'active' : ''}`}>
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
          {'badge' in item && item.badge && (
            <span className="sb-link-badge">{item.badge}</span>
          )}
        </Link>
      ))}

      <SellerCta context={role} />

      <div className="sb-spacer" />

      <div className="sb-link" style={{ color: 'var(--ink-3)' }}>
        <Icon name="help" size={14} />
        <span>Help &amp; docs</span>
      </div>

      <div ref={accountRef} style={{ position: 'relative' }}>
        {accountOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <Link
              href="/"
              onClick={() => setAccountOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-hover"
            >
              <Icon name="home" size={16} />
              <span>Back to site</span>
            </Link>
            {settingsHref && (
              <Link
                href={settingsHref}
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-hover"
              >
                <Icon name="settings" size={16} />
                <span>Account settings</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t border-line-soft px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              <Icon name="logout" size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          className="sb-user"
          style={{ width: '100%', textAlign: 'left' }}
        >
          <div className="sb-avatar">{userInitials}</div>
          <div className="sb-user-meta">
            <div className="sb-user-name">{displayName}</div>
            <div className="sb-user-mail">{displayMeta}</div>
          </div>
          <Icon
            name="chevron_up"
            size={14}
            style={{
              color: 'var(--ink-4)',
              transition: 'transform .2s ease',
              transform: accountOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>
      </div>
    </aside>
  );
}

/** Up to two uppercase initials from a name, falling back to email. */
function sidebarInitials(name?: string | null, email?: string | null): string {
  const src = (name || email || '').trim();
  if (!src) return 'U';
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
