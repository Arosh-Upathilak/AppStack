'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

interface SidebarProps {
  role: 'buyer' | 'seller';
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

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === 'seller' ? sellerNav : buyerNav;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const switchHref = role === 'buyer' ? '/seller' : '/buyer';

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">A</div>
        <div>
          <div className="sb-brand-name">AppStack</div>
          <div className="sb-brand-meta">{role === 'seller' ? 'Seller Portal' : 'Buyer Portal'}</div>
        </div>
      </div>

      <Link href={role === 'buyer' ? '/buyer/marketplace' : '/seller/products'}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
        <Icon name="plus" size={14} /> New Subscription
      </Link>

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

      <div className="sb-section">Switch role</div>
      <Link href={switchHref} className="sb-link" style={{ fontSize: 12.5 }}>
        <Icon name="refresh" size={14} />
        <span>Switch to {role === 'buyer' ? 'Seller' : 'Buyer'}</span>
      </Link>

      <div className="sb-spacer" />

      <div className="sb-link" style={{ color: 'var(--ink-3)' }}>
        <Icon name="help" size={14} />
        <span>Help &amp; docs</span>
      </div>

      <div className="sb-user">
        <div className="sb-avatar">SK</div>
        <div className="sb-user-meta">
          <div className="sb-user-name">Sarah Kim</div>
          <div className="sb-user-mail">acme.io</div>
        </div>
        <Icon name="chevron_up" size={14} style={{ color: 'var(--ink-4)' }} />
      </div>
    </aside>
  );
}
