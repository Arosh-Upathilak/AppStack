'use client';

import { useState } from 'react';
import CardWallet from '@/components/buyer/CardWallet';
import ConsentList from '@/components/buyer/ConsentList';
import ProfilePanel from '@/components/buyer/ProfilePanel';
import Icon from '@/components/Icon';

type Tab = 'profile' | 'cards' | 'consents';

export default function BuyerSettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'profile', label: 'Profile', icon: 'users' },
    { id: 'cards', label: 'Payment methods', icon: 'wallet' },
    { id: 'consents', label: 'Privacy & consents', icon: 'shield' },
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
        </nav>
      </aside>
      <section style={{ maxWidth: 760 }}>
        {tab === 'profile' && <ProfilePanel />}
        {tab === 'cards' && <CardWallet />}
        {tab === 'consents' && <ConsentList />}
      </section>
    </div>
  );
}
