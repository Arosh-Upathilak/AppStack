'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import CardWallet from '@/components/buyer/CardWallet';
import ConsentList from '@/components/buyer/ConsentList';
import InvoiceList from '@/components/buyer/InvoiceList';
import ProfilePanel from '@/components/buyer/ProfilePanel';
import SubscriptionList from '@/components/buyer/SubscriptionList';
import Icon from '@/components/Icon';

type Tab = 'profile' | 'subscriptions' | 'invoices' | 'cards' | 'consents' | 'notifications';

export default function BuyerSettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const { data: session } = useSession();

  const roles = session?.user.role ?? [];
  const showBecomeSeller = !roles.includes('SELLER');

  const tabs: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'profile', label: 'Profile', icon: 'users' },
    { id: 'subscriptions', label: 'Subscriptions', icon: 'package' },
    { id: 'invoices', label: 'Invoices', icon: 'receipt' },
    { id: 'cards', label: 'Payment methods', icon: 'wallet' },
    { id: 'consents', label: 'Privacy & consents', icon: 'shield' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
  ];

  return (
    <div className="page screen-enter" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, padding: 24 }}>
      <aside>
        <h2 style={{ margin: '4px 0 18px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</h2>
        <nav style={{ display: 'grid', gap: 2 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`sb-link ${tab === t.id ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <Icon name={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          ))}
          {showBecomeSeller && (
            <>
              <div style={{ height: 1, background: 'var(--line-soft, var(--line))', margin: '10px 4px' }} />
              <Link
                href="/buyer/become-seller"
                className="sb-link"
                style={{ width: '100%', textAlign: 'left' }}
              >
                <Icon name="package" size={14} />
                <span>Become a Seller</span>
              </Link>
            </>
          )}
        </nav>
      </aside>
      <section style={{ maxWidth: 760 }}>
        {tab === 'profile' && <ProfilePanel />}
        {tab === 'subscriptions' && <SubscriptionList />}
        {tab === 'invoices' && <InvoiceList />}
        {tab === 'cards' && <CardWallet />}
        {tab === 'consents' && <ConsentList />}
        {tab === 'notifications' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Notifications</div>
            <div className="muted" style={{ fontSize: 13.5 }}>
              Notification preferences are managed per subscription. Visit a subscription to toggle auto-renewal alerts.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
