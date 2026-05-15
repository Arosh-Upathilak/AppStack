import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About AppStack · Flexaro Pvt Ltd',
  description: 'AppStack is a SaaS subscription management platform built by Flexaro Pvt Ltd. Our mission is to bring clarity and control to enterprise software spending.',
};

export default function AboutPage() {
  return (
    <div className="pub-about">
      <div className="pub-about-hero">
        <h1 className="pub-hero-title" style={{ fontSize: 44 }}>Built to tame <span className="pub-hero-accent">software sprawl</span></h1>
        <p className="pub-hero-sub" style={{ maxWidth: 580, margin: '0 auto' }}>
          AppStack is a product of Flexaro Pvt Ltd. We saw enterprise teams drowning in disconnected SaaS tools, missed renewals, and seat waste — and built the platform we wished existed.
        </p>
      </div>

      <div className="pub-about-values">
        {[
          { icon: 'shield', title: 'Security first', desc: 'SOC 2 Type II certified. Credit card details never stored. All public forms protected by reCAPTCHA. Cloudflare-proxied.' },
          { icon: 'users', title: 'Team-centric design', desc: 'Built for the ops and finance teams who manage sprawling software estates — not just individual users.' },
          { icon: 'bolt', title: 'Developer-grade integrations', desc: 'Our REST API and webhook system let sellers integrate in under an hour. Full sandbox for testing before go-live.' },
          { icon: 'check_circle', title: 'GDPR compliant', desc: 'Every buyer consent is recorded per subscription. Sellers accept data protection agreements before listing.' },
        ].map(v => (
          <div key={v.title} className="pub-feature-card">
            <div className="pub-feature-icon"><Icon name={v.icon as Parameters<typeof Icon>[0]['name']} size={20} /></div>
            <h3 className="pub-feature-title">{v.title}</h3>
            <p className="pub-feature-desc">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="pub-about-cta">
        <h2>Join 10,000+ teams on AppStack</h2>
        <div className="row gap-3" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link href="/register" className="btn btn-primary" style={{ height: 44, padding: '0 24px', fontSize: 15 }}>Create your account</Link>
          <Link href="/marketplace" className="btn btn-secondary" style={{ height: 44, padding: '0 24px', fontSize: 15 }}>Explore the marketplace</Link>
        </div>
      </div>
    </div>
  );
}
