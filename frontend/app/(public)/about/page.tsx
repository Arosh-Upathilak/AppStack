import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About AppStack · Flexaro Pvt Ltd',
  description: 'AppStack is a SaaS subscription marketplace built by Flexaro Pvt Ltd. Buyers manage subscriptions from one dashboard; sellers list products and integrate via webhooks.',
};

export default function AboutPage() {
  return (
    <div className="pub-about">
      <div className="pub-about-hero">
        <h1 className="pub-hero-title" style={{ fontSize: 44 }}>One place to manage <span className="pub-hero-accent">SaaS subscriptions</span></h1>
        <p className="pub-hero-sub" style={{ maxWidth: 580, margin: '0 auto' }}>
          AppStack is a product of Flexaro Pvt Ltd. We&apos;re building a marketplace where buyers can discover and manage SaaS subscriptions in one dashboard, and sellers can list products, collect payments and integrate via webhooks.
        </p>
      </div>

      <div className="pub-about-values">
        {[
          { icon: 'shield', title: 'Privacy by design', desc: 'Credit card details are never stored on our servers. Buyer PII is never shown to sellers. All public forms are protected by reCAPTCHA and Cloudflare.' },
          { icon: 'users', title: 'Buyers & sellers', desc: 'A buyer dashboard for managing subscriptions, invoices and cards. A seller dashboard for listing products, tracking sales and withdrawing earnings.' },
          { icon: 'bolt', title: 'Built for integration', desc: 'Sellers integrate with AppStack through a documented REST API and webhooks, with a full sandbox environment to test before going live.' },
          { icon: 'check_circle', title: 'GDPR compliant', desc: 'Every buyer consent to share their email with a seller is recorded per subscription. Sellers accept data protection terms before listing.' },
        ].map(v => (
          <div key={v.title} className="pub-feature-card">
            <div className="pub-feature-icon"><Icon name={v.icon as Parameters<typeof Icon>[0]['name']} size={20} /></div>
            <h3 className="pub-feature-title">{v.title}</h3>
            <p className="pub-feature-desc">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="pub-about-cta">
        <h2>Get started with AppStack</h2>
        <div className="row gap-3" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link href="/register" className="btn btn-primary" style={{ height: 44, padding: '0 24px', fontSize: 15 }}>Create your account</Link>
          <Link href="/marketplace" className="btn btn-secondary" style={{ height: 44, padding: '0 24px', fontSize: 15 }}>Explore the marketplace</Link>
        </div>
      </div>
    </div>
  );
}
