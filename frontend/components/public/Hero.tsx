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
        {/* Eyebrow */}
        <span className="ps-eyebrow">
          <span className="ic">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </span>
          SOC 2 Type II verified
          <span className="sep"/>
          Trusted by <strong>10,000+ teams</strong>
        </span>

        {/* Headline */}
        <h1 className="ps-headline">
          <span className="line"><span>Subscription infrastructure</span></span>
          <span className="line"><span>for <span className="accent">modern software teams</span>.</span></span>
        </h1>

        {/* Sub */}
        <p className="ps-hero-sub">
          AppStack centralises every SaaS licence, invoice and renewal in one calm dashboard —
          so finance, IT and engineering all work from the same source of truth.
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
