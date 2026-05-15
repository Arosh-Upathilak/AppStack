import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="ps-footer">
      <div className="psite-wrap">
        <div className="ps-footer-grid">
          <div className="ps-footer-brand">
            <Link href="/" className="psite-logo" style={{ color: '#fff' }}>
              <div className="psite-logo-mark">A</div>
              <span>AppStack</span>
            </Link>
            <p>The unified platform for SaaS subscription management. Built for teams, trusted by enterprises.</p>
          </div>

          <div className="ps-footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link href="/buyer">Buyer dashboard</Link></li>
              <li><Link href="/seller">Sell on AppStack</Link></li>
            </ul>
          </div>

          <div className="ps-footer-col">
            <h4>Developers</h4>
            <ul>
              <li><a href="#docs">API docs</a></li>
              <li><a href="#sandbox">Sandbox</a></li>
              <li><a href="#webhooks">Webhooks</a></li>
              <li><a href="#changelog">Changelog</a></li>
            </ul>
          </div>

          <div className="ps-footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>

          <div className="ps-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#gdpr">GDPR</a></li>
              <li><a href="#cookies">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="ps-footer-bottom">
          <span>© {new Date().getFullYear()} Flexaro Pvt Ltd · All rights reserved.</span>
          <div className="ps-footer-badges">
            <span className="ps-footer-badge"><span className="pd"/>99.9% uptime</span>
            <span className="ps-footer-badge">SOC 2 · GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
