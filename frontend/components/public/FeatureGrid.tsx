import Icon from '@/components/Icon';

const FEATURES = [
  {
    icon: 'box',
    title: 'Unified subscription hub',
    desc: 'Every SaaS tool in one dashboard. See plans, seats, spend, and renewal dates without switching tabs.',
  },
  {
    icon: 'wallet',
    title: 'Automated billing',
    desc: 'Scheduled payment collection, retry logic, prorated upgrades, and instant invoice generation.',
  },
  {
    icon: 'bolt',
    title: 'Webhook-driven integrations',
    desc: 'AppStack notifies your SaaS products the moment a subscription is created, upgraded, or cancelled.',
  },
  {
    icon: 'shield',
    title: 'Enterprise security',
    desc: 'SOC 2 Type II certified. Cloudflare-proxied. PPI never exposed to sellers. GDPR-ready consent records.',
  },
  {
    icon: 'chart',
    title: 'Spend analytics',
    desc: 'Trajectory charts, MRR tracking, seat utilisation alerts, and forecast projections in one view.',
  },
  {
    icon: 'code',
    title: 'Developer-first API',
    desc: 'Documented REST API with a full sandbox environment. Integrate in minutes, not weeks.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="pub-features" id="features">
      <div className="pub-section-header">
        <h2 className="pub-section-title">Everything your stack needs</h2>
        <p className="pub-section-sub">Built for buyers who manage many tools and sellers who want easy, reliable payments.</p>
      </div>
      <div className="pub-feature-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="pub-feature-card">
            <div className="pub-feature-icon">
              <Icon name={f.icon as Parameters<typeof Icon>[0]['name']} size={20} />
            </div>
            <h3 className="pub-feature-title">{f.title}</h3>
            <p className="pub-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
