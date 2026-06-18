'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import { ToastContext } from '@/components/DashboardChrome';
import { PRODUCTS, Product } from '@/data/mock';

interface ProductDetailProps {
  productId: string;
  /** 'buyer' = Subscribe CTA; 'public' = Sign up CTA */
  mode?: 'buyer' | 'public';
}

// ── Tab subcomponents ─────────────────────────────────────

function ReviewCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 10 }}>
      <div className="row gap-1" style={{ marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={11} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />)}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 12px' }}>&quot;{quote}&quot;</p>
      <div className="row gap-2">
        <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{author.split(' ').map(n => n[0]).join('')}</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{author}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{role}</div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ p }: { p: Product }) {
  return (
    <div className="card card-pad">
      <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>About {p.name}</h3>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 24 }}>
        {p.name} is engineered to break down silos between sales, marketing and support teams. By centralizing customer data into a single, high-performance architecture, it enables organizations to move faster and make decisions based on real-time intelligence rather than historical guesswork.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: 'layers', title: 'Unified data core', desc: 'Centralize all customer interactions and transactional history.' },
          { icon: 'chart', title: 'Predictive analytics', desc: 'Forecast pipeline revenue and identify churn risks before they happen.' },
          { icon: 'cube', title: 'Workflow automation', desc: 'Design multi-stage automation sequences with the visual builder.' },
          { icon: 'shield', title: 'Enterprise security', desc: 'SOC 2 Type II with granular role-based access controls.' },
        ].map(f => (
          <div key={f.title} style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface-muted)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <Icon name={f.icon as Parameters<typeof Icon>[0]['name']} size={16} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Customer voices</h3>
        <button className="btn btn-ghost btn-sm">See all {p.reviews.toLocaleString()} <Icon name="arrow_right" size={11} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ReviewCard quote="Transformed our sales pipeline visibility. The unified dashboard gives our exec team exactly what they need without digging through reports." author="Sarah Jenkins" role="VP of Sales · TechCorp" />
        <ReviewCard quote="Migration was smoother than expected. The API documentation is stellar, making it easy to integrate with our existing ERP." author="Marcus Rivera" role="CTO · LogisticsPro" />
      </div>
    </div>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Icon name="check" size={14} style={{ color: 'var(--success)' }} />;
  if (v === false) return <Icon name="minus" size={14} style={{ color: 'var(--line-strong)' }} />;
  return <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>;
}

function FeaturesTab() {
  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ paddingLeft: 20 }}>Feature</th>
            <th style={{ textAlign: 'center' }}>Essentials</th>
            <th style={{ textAlign: 'center', background: 'var(--brand-soft)' }}>Professional</th>
            <th style={{ textAlign: 'center' }}>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {[
            { f: 'Contact management', e: '5K records', p: '50K records', x: 'Unlimited' },
            { f: 'Workflow automation', e: false, p: '20 workflows', x: 'Unlimited' },
            { f: 'API access', e: false, p: '10K calls/mo', x: 'Unlimited' },
            { f: 'Custom dashboards', e: '2', p: '20', x: 'Unlimited' },
            { f: 'Audit logs', e: false, p: '30 days', x: '1 year' },
            { f: 'SSO & SAML', e: false, p: false, x: true },
            { f: 'Dedicated success manager', e: false, p: false, x: true },
            { f: 'SLA guarantee', e: false, p: '99.5%', x: '99.99%' },
          ].map((row, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20, fontWeight: 500, color: 'var(--ink-1)' }}>{row.f}</td>
              <td style={{ textAlign: 'center' }}><Cell v={row.e} /></td>
              <td style={{ textAlign: 'center', background: 'rgba(232, 239, 255, 0.5)' }}><Cell v={row.p} /></td>
              <td style={{ textAlign: 'center' }}><Cell v={row.x} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: 'Slack', cat: 'Comms', hue: 'teamsync' }, { name: 'Google Workspace', cat: 'Productivity', hue: 'pixelgrid' },
    { name: 'Stripe', cat: 'Payments', hue: 'stripe' }, { name: 'Jira', cat: 'Project mgmt', hue: 'jira' },
    { name: 'Salesforce', cat: 'CRM', hue: 'cloudsync' }, { name: 'HubSpot', cat: 'Marketing', hue: 'pixelgrid' },
    { name: 'Zendesk', cat: 'Support', hue: 'teamsync' }, { name: 'Notion', cat: 'Docs', hue: 'notion' },
    { name: 'Linear', cat: 'Issue tracking', hue: 'linear' }, { name: 'Datadog', cat: 'Observability', hue: 'datadog' },
    { name: 'Intercom', cat: 'Messaging', hue: 'intercom' }, { name: 'Figma', cat: 'Design', hue: 'figma' },
  ];
  return (
    <div className="card card-pad">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Available integrations · {integrations.length}</h3>
        <div className="tb-search" style={{ width: 240 }}>
          <Icon name="search" size={13} className="tb-search-icon" />
          <input placeholder="Search integrations…" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {integrations.map(i => (
          <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>
            <AppLogo name={i.name} hue={i.hue} size="sm" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{i.cat}</div>
            </div>
            <Icon name="check_circle" size={14} style={{ color: 'var(--success)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({ p }: { p: Product }) {
  return (
    <div className="card card-pad">
      <div className="row gap-5" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink-1)' }}>{p.rating}</div>
          <div className="row gap-1" style={{ justifyContent: 'center', marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={14} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 8 }}>{p.reviews.toLocaleString()} reviews</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[5, 4, 3, 2, 1].map(r => {
            const pct = r === 5 ? 78 : r === 4 ? 16 : r === 3 ? 4 : r === 2 ? 1 : 1;
            return (
              <div key={r} className="row gap-3" style={{ fontSize: 12 }}>
                <span style={{ width: 12, color: 'var(--ink-3)' }}>{r}</span>
                <Icon name="star" size={11} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                <div style={{ flex: 1, height: 6, background: 'var(--surface-pressed)', borderRadius: 999 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 999 }} />
                </div>
                <span style={{ width: 30, textAlign: 'right', color: 'var(--ink-3)' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ReviewCard quote="Flexaro transformed our sales pipeline visibility. Our exec team finally has the data they need without digging through 4 different tools." author="Sarah Jenkins" role="VP of Sales · TechCorp" />
        <ReviewCard quote="Migration was smoother than expected. The API documentation is stellar, making it easy to integrate with our existing ERP." author="Marcus Rivera" role="CTO · LogisticsPro" />
        <ReviewCard quote="Onboarding was fast — we were running automations in production within a week. The pricing felt fair for the value delivered." author="Priya Shah" role="Head of Ops · Atlas Retail" />
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="card card-pad">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'shield', title: 'SOC 2 Type II', desc: 'Audited annually by an independent third party.' },
          { icon: 'lock', title: 'End-to-end encryption', desc: 'AES-256 at rest, TLS 1.3 in transit.' },
          { icon: 'check_circle', title: 'GDPR compliant', desc: 'Data residency in EU available on Enterprise.' },
          { icon: 'users', title: 'SSO & SCIM', desc: 'Okta, Azure AD, Google Workspace supported.' },
        ].map(s => (
          <div key={s.title} style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 10 }}>
            <div className="row gap-2">
              <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={18} style={{ color: 'var(--success)' }} />
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, background: 'var(--surface-muted)', borderRadius: 10, fontSize: 12.5, color: 'var(--ink-3)' }}>
        <strong style={{ color: 'var(--ink-1)' }}>Trust Center</strong> · Request DPA, view subprocessors, download attestation reports.
        <a style={{ color: 'var(--brand)', fontWeight: 600, marginLeft: 8 }}>Visit Trust Center <Icon name="external" size={10} /></a>
      </div>
    </div>
  );
}

const planData: Record<string, { base: number; features: string[] }> = {
  Essentials:   { base: 49,  features: ['Contact management', 'Standard reporting', 'Email integration', '10 GB storage'] },
  Professional: { base: 99,  features: ['Everything in Essentials', 'Advanced automation', 'Custom dashboards', 'API access', 'Priority support'] },
  Enterprise:   { base: 199, features: ['Everything in Professional', 'Dedicated success manager', 'SLA guarantees', 'SSO & advanced security', 'Audit logs'] },
};

function CheckoutModal({
  p, plan, seats, annual, effective, submitting, onClose, onConfirm,
}: {
  p: Product;
  plan: string;
  seats: number;
  annual: boolean;
  effective: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const period = annual ? 'year' : 'month';
  const billed = annual ? effective * 12 : effective;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 16 }}>
          <AppLogo name={p.name} hue={p.hue} size="lg" />
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Confirm subscription</h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{p.name} · {p.vendor}</div>
          </div>
        </div>

        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { k: 'Plan', v: plan },
            { k: 'Seats', v: `${seats} users` },
            { k: 'Billing', v: annual ? 'Annual' : 'Monthly' },
          ].map(row => (
            <div key={row.k} className="row" style={{ justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 13 }}>
              <span style={{ color: 'var(--ink-3)' }}>{row.k}</span>
              <span style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{row.v}</span>
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-muted)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Total · billed {annual ? 'annually' : 'monthly'}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>${billed.toLocaleString()}/{period}</div>
              {annual && <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>${effective.toLocaleString()}/mo equivalent</div>}
            </div>
          </div>
        </div>

        <div className="row gap-2" style={{ justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)', marginBottom: 16 }}>
          <Icon name="shield" size={11} /> Billed to your account on file · Cancel anytime
        </div>

        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Processing…' : <>Confirm subscription <Icon name="arrow_right" size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ productId, mode = 'buyer' }: ProductDetailProps) {
  const router = useRouter();
  const toastCtx = React.useContext(ToastContext);
  const toast = toastCtx?.toast ?? (() => {});

  const p = PRODUCTS.find(x => x.id === productId) || PRODUCTS[3];
  const [plan, setPlan] = React.useState('Professional');
  const [seats, setSeats] = React.useState(15);
  const [annual, setAnnual] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const monthly = planData[plan].base * seats;
  const annualMonthly = Math.round(monthly * 0.83);
  const effective = annual ? annualMonthly : monthly;
  const savings = (monthly - annualMonthly) * 12;

  const backHref = mode === 'buyer' ? '/buyer/marketplace' : '/marketplace';
  const ctaLabel = mode === 'buyer' ? 'Subscribe' : 'Sign Up to Purchase';
  const ctaAction = () => {
    if (mode === 'buyer') {
      setShowCheckout(true);
    } else {
      router.push(`/login?next=/marketplace/${productId}`);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // Simulate database / subscription action delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast(`Subscribed to ${p.name} (Demo subscription created)`);
      setSubmitting(false);
      setShowCheckout(false);
      router.push('/buyer/marketplace');
    } catch {
      toast('Could not complete subscription. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="page screen-enter">
      <div className="row gap-2" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(backHref)}>
          <Icon name="arrow_left" size={12} /> Back to Marketplace
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
          <AppLogo name={p.name} hue={p.hue} size="xl" />
          <div style={{ flex: 1 }}>
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.name}</h1>
              {p.badge && <Badge tone="brand"><Icon name="check" size={10} /> {p.badge}</Badge>}
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 14, maxWidth: 600 }}>{p.tagline}</div>
            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              <span className="row gap-1" style={{ display: 'inline-flex' }}>
                <Icon name="star" size={13} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                <strong style={{ color: 'var(--ink-1)' }}>{p.rating}</strong>
                <span className="muted">({p.reviews.toLocaleString()} reviews)</span>
              </span>
              <span className="row gap-1 muted"><Icon name="users" size={13} />{(p.reviews * 4.2 / 1000).toFixed(1)}K customers</span>
              <span className="row gap-1 muted"><Icon name="shield" size={13} />SOC 2 Type II</span>
              <span className="row gap-1 muted"><Icon name="bolt" size={13} />Installs in &lt; 10 min</span>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-secondary"><Icon name="external" size={13} /> Open website</button>
            <button className="btn btn-secondary"><Icon name="play" size={13} /> Watch demo</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>
        <div>
          <div className="tabs">
            {['overview', 'features', 'integrations', 'reviews', 'security'].map(tab => (
              <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                {tab === 'reviews' ? `Reviews · ${p.reviews.toLocaleString()}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {activeTab === 'overview' && <OverviewTab p={p} />}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'reviews' && <ReviewsTab p={p} />}
          {activeTab === 'security' && <SecurityTab />}
        </div>

        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-head">
            <div><div className="card-title">Try {p.name}</div><div className="card-sub">14-day free trial · No card required</div></div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Annual billing</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>Save 17% vs monthly</div>
              </div>
              <div className={`switch ${annual ? 'on' : ''}`} onClick={() => setAnnual(!annual)} />
            </div>

            <div>
              <div className="field-label">Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.keys(planData).map(k => (
                  <div key={k} onClick={() => setPlan(k)}
                       style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${plan === k ? 'var(--brand)' : 'var(--line)'}`, background: plan === k ? 'var(--brand-soft)' : 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 120ms, background 120ms' }}>
                    <div className="row gap-2">
                      <div style={{ width: 14, height: 14, borderRadius: 999, border: `2px solid ${plan === k ? 'var(--brand)' : 'var(--line-strong)'}`, position: 'relative' }}>
                        {plan === k && <div style={{ position: 'absolute', inset: 2, borderRadius: 999, background: 'var(--brand)' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{k}</div>
                        {k === 'Professional' && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Most popular</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>${planData[k].base}/user</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="field-label" style={{ marginBottom: 0 }}>Seats</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>{seats} users</span>
              </div>
              <input type="range" className="rng" min="1" max="100" value={seats} onChange={e => setSeats(+e.target.value)} />
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 10.5, color: 'var(--ink-4)', marginTop: 4 }}>
                <span>1</span><span>25</span><span>50</span><span>75</span><span>100+</span>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Base · {seats} × ${planData[plan].base}</span>
                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>${monthly.toLocaleString()}/mo</span>
              </div>
              {annual && (
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--success)' }}>Annual discount (17%)</span>
                  <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--success)' }}>-${(monthly - annualMonthly).toLocaleString()}/mo</span>
                </div>
              )}
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600 }}>You pay</div>
                  {annual && <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500, marginTop: 2 }}>Save ${savings.toLocaleString()}/year</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>${effective.toLocaleString()}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>/month, billed {annual ? 'annually' : 'monthly'}</div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={ctaAction}>
              {ctaLabel} <Icon name="arrow_right" size={13} />
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Talk to sales</button>
            <div className="row gap-2" style={{ justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)' }}>
              <Icon name="shield" size={11} /> Cancel anytime · No setup fees
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          p={p}
          plan={plan}
          seats={seats}
          annual={annual}
          effective={effective}
          submitting={submitting}
          onClose={() => !submitting && setShowCheckout(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
