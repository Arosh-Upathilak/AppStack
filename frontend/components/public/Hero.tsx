import Link from 'next/link';
import ProductPreview from './ProductPreview';

export default function Hero() {
  return (
    <section className="psite-hero">
      {/* Aurora blobs */}
      <div className="ps-aurora">
        <div className="blob b1"/>
        <div className="blob b2"/>
        <div className="blob b3"/>
      </div>
      {/* Hairline grid */}
      <div className="ps-grid-bg"/>

      <div className="psite-wrap psite-hero-inner">
        {/* Headline */}
        <h1 className="ps-headline">
          <span className="line"><span>All your SaaS subscriptions,</span></span>
          <span className="line"><span>in <span className="accent">one dashboard</span>.</span></span>
        </h1>

        {/* Sub */}
        <p className="ps-hero-sub">
          Discover SaaS products, subscribe in a click, and manage every plan, payment and invoice from a single place — with automated billing and refunds built in.
        </p>

        {/* CTA */}
        <div className="ps-hero-cta">
          <Link href="/register" className="ps-btn ps-btn-primary" style={{ padding: '12px 22px', fontSize: 15 }}>
            Start for free <span className="ps-arrow">→</span>
          </Link>
          <Link href="#features" className="ps-btn ps-btn-secondary" style={{ padding: '12px 20px', fontSize: 15 }}>
            See the platform
          </Link>
        </div>
      </div>

      {/* Product preview */}
      <div className="psite-wrap">
        <ProductPreview />
      </div>
    </section>
  );
}
