'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import StatTile from '@/components/StatTile';
import { useToastContext } from '@/components/DashboardChrome';
import { SUBSCRIPTIONS } from '@/data/mock';

function ActionRow({ icon, label, desc, toggle, defaultOn, danger, onClick }: {
  icon: string; label: string; desc: string;
  toggle?: boolean; defaultOn?: boolean; danger?: boolean; onClick?: () => void;
}) {
  const [on, setOn] = React.useState(defaultOn || false);
  return (
    <div className="row gap-3" style={{ padding: '12px 20px', borderTop: '1px solid var(--line-soft)', cursor: onClick || toggle ? 'pointer' : 'default' }}
         onClick={() => { if (toggle) setOn(!on); onClick?.(); }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: danger ? 'var(--danger-soft)' : 'var(--surface-muted)', color: danger ? 'var(--danger)' : 'var(--ink-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--ink-1)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{desc}</div>
      </div>
      {toggle ? <div className={`switch ${on ? 'on' : ''}`} /> : <Icon name="chevron_right" size={14} style={{ color: 'var(--ink-4)' }} />}
    </div>
  );
}

function CancelModal({ onClose, sub, toast }: { onClose: () => void; sub: typeof SUBSCRIPTIONS[0]; toast: (m: string) => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <Icon name="warn" size={22} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Cancel {sub.name}?</h3>
          <p style={{ color: 'var(--ink-3)', margin: '8px 0 16px', fontSize: 13.5, lineHeight: 1.55 }}>
            You&apos;ll keep access until <strong style={{ color: 'var(--ink-1)' }}>{sub.renew}, 2024</strong>, then access will be revoked for all {sub.seats.split('/')[0]} team members. Data is retained for 90 days.
          </p>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
              <Icon name="sparkle" size={14} style={{ color: 'var(--accent)', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Pause instead?</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Keep your data and re-activate any time — billing stops immediately.</div>
              </div>
              <button className="btn btn-soft btn-sm">Pause</button>
            </div>
          </div>
          <label className="field-label">Reason (optional)</label>
          <select className="input" style={{ marginBottom: 16 }}>
            <option>Too expensive</option><option>Switching to another tool</option><option>No longer needed</option><option>Other</option>
          </select>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--line-soft)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Keep subscription</button>
          <button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
                  onClick={() => { onClose(); toast(`Cancelled — access ends ${sub.renew}`); }}>
            Confirm cancellation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionDetail({ subId }: { subId: string }) {
  const router = useRouter();
  const { toast } = useToastContext();
  const sub = SUBSCRIPTIONS.find(x => x.id === subId) || SUBSCRIPTIONS[0];
  const currentSeats = parseInt(sub.seats.split('/')[0]);
  const totalSeats = parseInt(sub.seats.split('/')[1]);
  const seatPrice = Math.round(sub.price / totalSeats);
  const [seatsTarget, setSeatsTarget] = React.useState(totalSeats);
  const newCost = seatsTarget * seatPrice;
  const delta = newCost - sub.price;
  const [showCancel, setShowCancel] = React.useState(false);

  const plans = [
    { name: 'Starter', price: Math.round(seatPrice * 0.4), tagline: 'Basic features for small teams', features: ['Up to 25 users', 'Email support', 'Basic analytics'] },
    { name: 'Pro', price: seatPrice, tagline: 'Advanced tooling for growing companies', features: ['Up to 200 users', 'Priority support', 'Advanced analytics', 'API access'], current: sub.plan.includes('Pro') || sub.plan === 'Standard' || sub.plan === 'Team' },
    { name: 'Enterprise', price: Math.round(seatPrice * 2.5), tagline: 'Unlimited scale with white-glove support', features: ['Unlimited users', '24/7 phone support', 'Custom dashboards', 'Dedicated CSM', 'SSO + SAML', 'SLA guarantee'], current: sub.plan === 'Enterprise' },
  ];

  const invoiceHistory = [
    { id: 'INV-2024-1042', date: 'Oct 15, 2024', amount: sub.price }, { id: 'INV-2024-0988', date: 'Sep 15, 2024', amount: sub.price },
    { id: 'INV-2024-0921', date: 'Aug 15, 2024', amount: sub.price }, { id: 'INV-2024-0821', date: 'Jul 15, 2024', amount: sub.price },
    { id: 'INV-2024-0742', date: 'Jun 15, 2024', amount: sub.price },
  ];

  return (
    <div className="page screen-enter">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => router.push('/buyer')}>
        <Icon name="arrow_left" size={12} /> Back to overview
      </button>

      <div className="row gap-4" style={{ alignItems: 'flex-start', marginBottom: 24 }}>
        <AppLogo name={sub.name} hue={sub.hue} size="xl" />
        <div style={{ flex: 1 }}>
          <div className="row gap-2" style={{ marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{sub.name}</h1>
            <Badge tone="success" dot>{sub.status === 'attention' ? 'Attention needed' : 'Active'}</Badge>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>{sub.vendor} · subscribed since Aug 2023 · admin: sarah@acme.io</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-secondary"><Icon name="help" size={13} /> Get support</button>
          <button className="btn btn-secondary"><Icon name="external" size={13} /> Open app</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatTile label="Monthly cost" value={`$${sub.price}`} sub={`$${seatPrice}/seat × ${totalSeats}`} icon="wallet" />
        <StatTile label="Seat usage" value={`${currentSeats}/${totalSeats}`} delta={`${Math.round(sub.usage * 100)}% utilized`} deltaDir={sub.usage > 0.9 ? 'up' : 'flat'} icon="users" />
        <StatTile label="Next renewal" value={sub.renew} sub={sub.status === 'renewing' ? 'Renews in 8 days' : 'Auto-renews'} icon="calendar" />
        <StatTile label="Total spend" value={`$${(sub.price * 14).toLocaleString()}`} sub="14 months on plan" icon="activity" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Change plan</div><div className="card-sub">Upgrades take effect immediately · Downgrades at next renewal</div></div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {plans.map(p => (
                <div key={p.name} className={`plan-card ${p.current ? 'is-current' : ''} ${p.name === 'Enterprise' && !p.current ? 'is-featured' : ''}`}>
                  {p.current && <Badge tone="brand" style={{ position: 'absolute', top: -8, left: 16 }}>Current Plan</Badge>}
                  {p.name === 'Enterprise' && !p.current && <Badge tone="accent" style={{ position: 'absolute', top: -8, left: 16 }}>Recommended</Badge>}
                  <div>
                    <div className="pc-name" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>{p.name}</div>
                    <div className="pc-sub" style={{ fontSize: 12, color: 'var(--ink-3)', minHeight: 32 }}>{p.tagline}</div>
                  </div>
                  <div>
                    <span className="pc-price" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>${p.price}</span>
                    <span className="pc-sub" style={{ fontSize: 12, color: 'var(--ink-3)' }}>/seat/mo</span>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.features.map(f => (
                      <li key={f} className="pc-feature row gap-2" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                        <Icon name="check" size={12} style={{ color: p.name === 'Enterprise' && !p.current ? 'var(--accent)' : 'var(--success)', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.current ? <button className="btn btn-secondary" disabled>Current plan</button>
                   : p.price < seatPrice ? <button className="btn btn-secondary" onClick={() => toast(`Plan change scheduled for ${sub.renew}`)}>Downgrade</button>
                   : <button className={p.name === 'Enterprise' ? 'btn' : 'btn btn-primary'}
                              style={p.name === 'Enterprise' ? { background: '#fff', color: 'var(--ink-1)' } : {}}
                              onClick={() => toast(`Upgraded to ${p.name} — effective immediately`)}>
                       Upgrade <Icon name="arrow_up" size={12} />
                     </button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Quick actions</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
            <ActionRow icon="users" label="Manage seats" desc={`${currentSeats}/${totalSeats} active`} />
            <ActionRow icon="wallet" label="Update billing" desc="Visa ending in 4242" />
            <ActionRow icon="download" label="Download invoices" desc="14 historical invoices" />
            <ActionRow icon="refresh" label="Auto-renewal" desc="Enabled" toggle />
            <ActionRow icon="bell" label="Renewal alerts" desc="7 days before" toggle defaultOn />
            <ActionRow icon="trash" label="Cancel subscription" desc="Revoked at end of period" danger onClick={() => setShowCancel(true)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">
          <div><div className="card-title">Seat management</div><div className="card-sub">Adjust your seat count — prorated charges apply immediately</div></div>
          <button className="btn btn-secondary btn-sm"><Icon name="users" size={12} /> Invite member</button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="field-label" style={{ marginBottom: 0 }}>Total seats</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{seatsTarget} <span className="muted" style={{ fontWeight: 400 }}>/ 100 max</span></span>
              </div>
              <input type="range" className="rng" min={currentSeats} max="100" value={seatsTarget} onChange={e => setSeatsTarget(+e.target.value)} />
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 10.5, color: 'var(--ink-4)', marginTop: 4 }}>
                <span>Currently using {currentSeats}</span>
                <span>+{Math.max(0, seatsTarget - totalSeats)} new seats</span>
              </div>
              <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-muted)', borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span className="muted">Currently paying</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>${sub.price}/mo</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span className="muted">{seatsTarget} seats × ${seatPrice}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>${newCost}/mo</span>
                </div>
                <div className="divider" style={{ margin: '10px 0' }} />
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>New monthly cost</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>${newCost}</div>
                    {delta !== 0 && <div style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? 'var(--warning)' : 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{delta > 0 ? '+' : ''}${delta}/mo</div>}
                  </div>
                </div>
                {delta > 0 && <div style={{ marginTop: 10, padding: 8, background: 'var(--warning-soft)', borderRadius: 6, fontSize: 11.5, color: 'var(--warning)' }}><Icon name="info" size={11} /> Prorated charge of ${Math.round(delta * 0.7)} will be applied today.</div>}
              </div>
              {delta !== 0 && <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }} onClick={() => toast(`Seats updated to ${seatsTarget}`)}>Apply changes</button>}
            </div>
            <div>
              <div className="field-label">Members</div>
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { name: 'Sarah Kim', email: 'sarah@acme.io', role: 'Admin', avatar: 'SK' },
                  { name: 'Marcus Rivera', email: 'marcus@acme.io', role: 'Member', avatar: 'MR' },
                  { name: 'Priya Shah', email: 'priya@acme.io', role: 'Member', avatar: 'PS' },
                  { name: "James O'Brien", email: 'james@acme.io', role: 'Member', avatar: 'JO' },
                ].map((m, i) => (
                  <div key={m.email} className="row gap-2" style={{ padding: '10px 12px', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
                    <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{m.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{m.email}</div>
                    </div>
                    <Badge tone={m.role === 'Admin' ? 'brand' : 'soft'}>{m.role}</Badge>
                  </div>
                ))}
                <div style={{ padding: 8, background: 'var(--surface-muted)', textAlign: 'center', borderTop: '1px solid var(--line-soft)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>+ Show all {currentSeats} members</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Invoice history</div><div className="card-sub">14 invoices · last 12 months</div></div>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={12} /> Download all</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Invoice ID</th><th>Date</th><th className="num">Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoiceHistory.map(inv => (
              <tr key={inv.id}>
                <td style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{inv.id}</td>
                <td className="muted">{inv.date}</td>
                <td className="num" style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>${inv.amount.toLocaleString()}.00</td>
                <td><Badge tone="success" dot>Paid</Badge></td>
                <td className="col-action"><button className="btn btn-ghost btn-sm" onClick={() => toast('Invoice downloaded')}><Icon name="download" size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCancel && <CancelModal onClose={() => setShowCancel(false)} sub={sub} toast={toast} />}
    </div>
  );
}
