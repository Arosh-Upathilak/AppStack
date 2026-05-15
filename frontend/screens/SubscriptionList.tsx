'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import { SubCard } from './BuyerHome';
import { useToastContext } from '@/components/DashboardChrome';
import { SUBSCRIPTIONS } from '@/data/mock';

export default function SubscriptionList() {
  const router = useRouter();
  const { toast } = useToastContext();
  const [filter, setFilter] = React.useState('all');
  let items = SUBSCRIPTIONS;
  if (filter === 'attention') items = items.filter(s => s.status === 'attention' || s.status === 'renewing');

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">All subscriptions</h1>
          <p className="page-sub">Your full software stack — manage plans, seats and renewals.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => toast('Exported')}><Icon name="download" size={13} /> Export</button>
          <button className="btn btn-primary" onClick={() => router.push('/buyer/marketplace')}>
            <Icon name="plus" size={13} /> Add subscription
          </button>
        </div>
      </div>

      <div className="row gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All · 12</button>
        <button className={`pill ${filter === 'attention' ? 'active' : ''}`} onClick={() => setFilter('attention')}>Needs attention · 2</button>
        <button className="pill">By category</button>
        <button className="pill">By owner</button>
        <div style={{ marginLeft: 'auto' }} className="row gap-2">
          <div className="tb-search" style={{ width: 240 }}>
            <Icon name="search" size={13} className="tb-search-icon" />
            <input placeholder="Search subscriptions…" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {items.map(s => <SubCard key={s.id} sub={s} onClick={() => router.push(`/buyer/subscriptions/${s.id}`)} />)}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Product</th>
              <th>Plan</th>
              <th className="num">Cost</th>
              <th>Seats</th>
              <th>Renews</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SUBSCRIPTIONS.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/buyer/subscriptions/${s.id}`)}>
                <td style={{ paddingLeft: 20 }}>
                  <div className="row gap-3">
                    <AppLogo name={s.name} hue={s.hue} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{s.vendor}</div>
                    </div>
                  </div>
                </td>
                <td>{s.plan}</td>
                <td className="num" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>${s.price}/{s.cycle}</td>
                <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.seats}</td>
                <td className="muted">{s.renew}</td>
                <td>
                  {s.status === 'attention' ? <Badge tone="danger" dot>Attention</Badge> :
                   s.status === 'renewing' ? <Badge tone="warning" dot>Renews soon</Badge> :
                   <Badge tone="success" dot>Active</Badge>}
                </td>
                <td className="col-action"><Icon name="chevron_right" size={14} style={{ color: 'var(--ink-4)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
