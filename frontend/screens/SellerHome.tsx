'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import StatTile from '@/components/StatTile';
import Sparkline from '@/components/Sparkline';
import RevenueChart from '@/components/charts/RevenueChart';
import { useToastContext } from '@/components/DashboardChrome';

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

const sellerSpark = [3200, 3600, 3900, 4200, 4500, 4900, 5400, 5800, 6300, 6900, 7600, 8400, 9100, 9800, 10800, 12450];

export default function SellerHome() {
  const router = useRouter();
  const { toast } = useToastContext();
  const [range, setRange] = React.useState('M');

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Seller dashboard</h1>
          <p className="page-sub">Track sales, manage products and request payouts in one place.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => toast('Exported')}><Icon name="download" size={13} /> Export</button>
          <button className="btn btn-primary" onClick={() => router.push('/seller/products')}>
            <Icon name="plus" size={13} /> Add product
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatTile label="Total earnings" value="$12,450" delta="+15.3%" deltaDir="up" icon="wallet" sub="Month-to-date" sparkData={sellerSpark} />
        <StatTile label="Active subscribers" value="842" delta="+42 this week" deltaDir="up" icon="users" sub="Across 3 products" />
        <StatTile label="New sales (30d)" value="156" delta="-2.1% vs prev" deltaDir="down" icon="store" sub="$8,212 GMV" />
        <StatTile label="Churn rate" value="2.4%" delta="Healthy" deltaDir="flat" icon="activity" sub="Industry avg 4.1%" />
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0a1330 0%, #003d9b 100%)', borderColor: 'transparent', color: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 170, 194, 0.25), transparent 70%)' }} />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, position: 'relative' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Available balance</div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8 }}>$14,250.00</div>
            <div className="row gap-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}><Icon name="arrow_up" size={12} /> +12.5% this month</div>
            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button className="btn" style={{ background: '#fff', color: 'var(--ink-1)' }} onClick={() => toast('Payout requested')}>Request payout <Icon name="arrow_right" size={12} /></button>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>Manage accounts</button>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Pending funds</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>$3,180.50</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>Clearing in 2-3 business days based on standard lock period.</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Last payout</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>$8,450.00</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>To Chase ··4592 · Oct 1, 2024</div>
            <div className="row gap-1" style={{ marginTop: 10, fontSize: 11.5 }}><Icon name="check_circle" size={11} style={{ color: '#3fdda3' }} /><span style={{ color: 'rgba(255,255,255,0.85)' }}>Completed in 1.2 days</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Revenue growth</div><div className="card-sub">Last 12 months · MRR trajectory</div></div>
            <div className="seg">
              <button className={range === 'W' ? 'active' : ''} onClick={() => setRange('W')}>W</button>
              <button className={range === 'M' ? 'active' : ''} onClick={() => setRange('M')}>M</button>
              <button className={range === 'Y' ? 'active' : ''} onClick={() => setRange('Y')}>Y</button>
            </div>
          </div>
          <div className="card-body">
            <RevenueChart data={sellerSpark} />
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              <Legend dotColor="var(--brand)" label="MRR" value="$12,450" />
              <Legend dotColor="var(--accent)" label="ARR" value="$149,400" />
              <Legend dotColor="var(--brand-soft-2)" label="12mo growth" value="+289%" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title">Activity</div></div><button className="btn btn-ghost btn-sm">View all</button></div>
          <div style={{ padding: '8px 4px 14px' }}>
            {[
              { icon: 'store', tone: 'brand', t1: 'New sale', t2: 'Enterprise Tier', meta: 'Sarah Jenkins · 10m ago', amt: '+$199' },
              { icon: 'x', tone: 'danger', t1: 'Cancellation', t2: 'Starter Tier', meta: 'TechCorp · 2h ago', amt: '-$29' },
              { icon: 'refresh', tone: 'success', t1: 'Renewal', t2: 'Pro Tier (Annual)', meta: 'Design Studio · 5h ago', amt: '+$1,188' },
              { icon: 'store', tone: 'brand', t1: 'New sale', t2: 'Pro Tier', meta: 'Mike Ross · 1d ago', amt: '+$99' },
              { icon: 'edit', tone: 'soft', t1: 'Product updated', t2: 'API Access', meta: 'System · 1d ago', amt: '' },
            ].map((a, i) => (
              <div key={i} className="row gap-3" style={{ padding: '8px 16px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: a.tone === 'brand' ? 'var(--brand-soft)' : a.tone === 'danger' ? 'var(--danger-soft)' : a.tone === 'success' ? 'var(--success-soft)' : 'var(--surface-muted)', color: a.tone === 'brand' ? 'var(--brand)' : a.tone === 'danger' ? 'var(--danger)' : a.tone === 'success' ? 'var(--success)' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={a.icon as Parameters<typeof Icon>[0]['name']} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-1)' }}>{a.t1}: <strong>{a.t2}</strong></div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.meta}</div>
                </div>
                {a.amt && <div style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: a.amt.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>{a.amt}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">My products</div><div className="card-sub">3 active · 1 in draft</div></div>
          <div className="row gap-2">
            <div className="tb-search" style={{ width: 220 }}><Icon name="search" size={13} className="tb-search-icon" /><input placeholder="Search products…" /></div>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={12} /> Add product</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr><th style={{ paddingLeft: 20 }}>Product</th><th>Status</th><th className="num">Subscribers</th><th className="num">MRR</th><th>Last 30d</th><th>Health</th><th></th></tr>
          </thead>
          <tbody>
            {[
              { name: 'Enterprise API Access', cat: 'API & Integration', hue: 'cloudsync', status: 'Published', subs: 412, mrr: 8240, trend: [12,14,13,18,17,22,25,24,27,29,31,34], health: 'good' },
              { name: 'Pro Tools Plugin', cat: 'Productivity', hue: 'pixelgrid', status: 'Published', subs: 289, mrr: 2890, trend: [8,9,10,12,11,14,13,15,14,16,18,17], health: 'good' },
              { name: 'Data Export Module', cat: 'Analytics', hue: 'metricsync', status: 'Published', subs: 141, mrr: 1410, trend: [16,15,14,13,12,11,11,10,9,8,7,6], health: 'warn' },
              { name: 'TeamFlow Beta', cat: 'Collaboration', hue: 'teamsync', status: 'Draft', subs: 0, mrr: 0, trend: [0,0,0,0,0,0,0,0,0,0,0,0], health: 'draft' },
            ].map(p => (
              <tr key={p.name}>
                <td style={{ paddingLeft: 20 }}><div className="row gap-3"><AppLogo name={p.name} hue={p.hue} size="sm" /><div><div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{p.name}</div><div className="muted" style={{ fontSize: 11.5 }}>{p.cat}</div></div></div></td>
                <td>{p.status === 'Published' ? <Badge tone="success" dot>Published</Badge> : <Badge tone="warning">Draft</Badge>}</td>
                <td className="num" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{p.subs.toLocaleString()}</td>
                <td className="num" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>${p.mrr.toLocaleString()}</td>
                <td><div style={{ width: 80 }}>{p.trend.some(v => v > 0) && <Sparkline data={p.trend} h={24} color={p.health === 'warn' ? 'var(--danger)' : 'var(--brand)'} fill={p.health === 'warn' ? 'var(--danger-soft)' : 'var(--brand-soft)'} />}</div></td>
                <td>{p.health === 'good' ? <Badge tone="success">Healthy</Badge> : p.health === 'warn' ? <Badge tone="warning">Declining</Badge> : <Badge>—</Badge>}</td>
                <td className="col-action"><div className="row gap-1" style={{ justifyContent: 'flex-end' }}><button className="btn btn-ghost btn-sm"><Icon name="chart" size={12} /></button><button className="btn btn-ghost btn-sm"><Icon name="edit" size={12} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
