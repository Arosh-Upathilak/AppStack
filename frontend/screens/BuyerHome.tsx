'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import StatTile from '@/components/StatTile';
import SpendChart from '@/components/charts/SpendChart';
import { useToastContext } from '@/components/DashboardChrome';
import { SUBSCRIPTIONS, INVOICES, RENEWALS, SPEND_DATA, SPEND_MONTHS, Subscription } from '@/data/mock';

function Legend({ dotColor, label, value }: { dotColor: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, display: 'inline-block' }} />
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: 0.05 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
    </div>
  );
}

export function SubCard({ sub, onClick }: { sub: Subscription; onClick: () => void }) {
  const usageColor = sub.usage > 0.95 ? 'var(--danger)' : sub.usage > 0.9 ? 'var(--warning)' : 'var(--brand)';
  return (
    <div className="sub-card" onClick={onClick}>
      <div className="sc-top">
        <AppLogo name={sub.name} hue={sub.hue} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sc-name">{sub.name}</div>
          <div className="sc-vendor">{sub.vendor}</div>
        </div>
        {sub.status === 'attention' ? <Badge tone="danger" dot>Attention</Badge> :
         sub.status === 'renewing' ? <Badge tone="warning" dot>Renews soon</Badge> :
         <Badge tone="success" dot>Active</Badge>}
      </div>
      <div className="sc-grid">
        <div><div className="k">Plan</div><div className="v">{sub.plan}</div></div>
        <div><div className="k">Cost</div><div className="v">${sub.price}<span style={{ color: 'var(--ink-4)', fontSize: 11, fontWeight: 500 }}>/{sub.cycle}</span></div></div>
        <div><div className="k">Seats</div><div className="v">{sub.seats}</div></div>
        <div><div className="k">Renews</div><div className="v">{sub.renew}</div></div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-4)', marginBottom: 4 }}>
          <span>Seat usage</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: usageColor, fontWeight: 600 }}>{Math.round(sub.usage * 100)}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--surface-pressed)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(sub.usage * 100, 100)}%`, height: '100%', background: usageColor, borderRadius: 999, transition: 'width 400ms cubic-bezier(0.2, 0.7, 0.2, 1)' }} />
        </div>
      </div>
    </div>
  );
}

export default function BuyerHome() {
  const router = useRouter();
  const { toast } = useToastContext();
  const totalSpend = SUBSCRIPTIONS.reduce((s, x) => s + x.price, 0);

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Good afternoon, Sarah</h1>
          <p className="page-sub">Here&apos;s your subscription stack at a glance.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary"><Icon name="download" size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => router.push('/buyer/marketplace')}>
            <Icon name="plus" size={14} /> Add subscription
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-md)', marginBottom: 24 }}>
        <StatTile label="Monthly spend" value={`$${totalSpend.toLocaleString()}`} delta="+8.4%" deltaDir="up" icon="wallet" sub="Across 6 vendors" sparkData={SPEND_DATA} />
        <StatTile label="Active subscriptions" value="12" delta="+2 this month" deltaDir="up" icon="box" sub="6 expiring in 60 days" />
        <StatTile label="Seat utilization" value="76%" delta="-3% vs last month" deltaDir="down" icon="users" sub="2 plans near capacity" />
        <StatTile label="Pending renewals" value="3" delta="Within 30 days" deltaDir="flat" icon="calendar" sub="$2,450 total" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 24, background: 'linear-gradient(180deg, var(--brand-soft), var(--surface))', borderColor: 'transparent' }}>
        <div className="row gap-3" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icon name="bolt" size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>3 actions need your attention</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>SecureGuard Net renews in 8 days · Jira has 0 seats remaining · 1 overdue invoice ($195)</div>
            </div>
          </div>
          <button className="btn btn-secondary">Review all <Icon name="arrow_right" size={12} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Spend trajectory</div>
              <div className="card-sub">Last 12 months · Projected $4,580 next month</div>
            </div>
            <div className="seg">
              <button className="active">12M</button>
              <button>6M</button>
              <button>3M</button>
              <button>30D</button>
            </div>
          </div>
          <div className="card-body">
            <SpendChart data={SPEND_DATA} months={SPEND_MONTHS} />
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              <Legend dotColor="var(--brand)" label="Actual spend" value="$4,250/mo" />
              <Legend dotColor="var(--brand-soft-2)" label="12mo growth" value="+102%" />
              <Legend dotColor="var(--accent)" label="Forecast" value="$4,580" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Upcoming renewals</div><div className="card-sub">Next 60 days</div></div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <div className="card-body" style={{ padding: '8px 20px 16px' }}>
            <div className="timeline">
              {RENEWALS.map((r, i) => (
                <div className="tl-row" key={i}>
                  <div className="tl-date">{r.date}</div>
                  <div className={`tl-dot ${r.tone === 'warn' ? 'warn' : r.tone === 'muted' ? 'muted' : ''}`} />
                  <div className="tl-body">
                    <div><div className="tl-title">{r.name}</div><div className="tl-meta">in {r.days} days</div></div>
                    <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>${r.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Active subscriptions</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/buyer/subscriptions')}>
          View all 12 <Icon name="arrow_right" size={12} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {SUBSCRIPTIONS.slice(0, 6).map(s => (
          <SubCard key={s.id} sub={s} onClick={() => router.push(`/buyer/subscriptions/${s.id}`)} />
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Recent invoices</div><div className="card-sub">Last 30 days · 5 invoices · $2,885 total</div></div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm"><Icon name="filter" size={12} /> Filter</button>
            <button className="btn btn-secondary btn-sm"><Icon name="download" size={12} /> Download all</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Invoice</th><th>Product</th><th>Date</th><th className="num">Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id}>
                <td><span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{inv.id}</span></td>
                <td>{inv.product}</td>
                <td className="muted">{inv.date}</td>
                <td className="num" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>${inv.amount.toLocaleString()}.00</td>
                <td>{inv.status === 'paid' ? <Badge tone="success" dot>Paid</Badge> : <Badge tone="danger" dot>Overdue</Badge>}</td>
                <td className="col-action">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast('Invoice downloaded')}><Icon name="download" size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
