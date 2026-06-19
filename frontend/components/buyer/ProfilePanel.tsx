'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

interface Me {
  email: string;
  name?: string;
  roles: string[];
  sellerStatus?: string;
}

export default function ProfilePanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setMe(await r.json());
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="muted" style={{ fontSize: 13 }}>Loading…</div>;
  if (!me?.email) return <div className="muted" style={{ fontSize: 13 }}>Not signed in.</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Profile</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
          Your account information. To request a deletion or export, contact support.
        </div>
      </div>

      <div className="card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <Row label="Name" value={me.name || '—'} />
        <Row label="Email" value={me.email} />
        <Row label="Roles" value={me.roles.length ? me.roles.join(', ') : 'None'} />
        {me.sellerStatus && <Row label="Seller status" value={me.sellerStatus} />}
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/forgot" className="btn">
          <Icon name="lock" size={14} /> Change password
        </a>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink-1)' }}>{value}</div>
    </div>
  );
}
