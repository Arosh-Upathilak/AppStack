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
            <p>A platform for buyers to manage SaaS subscriptions and for sellers to list, sell and integrate their SaaS products.</p>
          </div>

          <div className="ps-footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><Link href="/buyer">Buyer dashboard</Link></li>
              <li><Link href="/seller">Sell on AppStack</Link></li>
            </ul>
          </div>

          <div className="ps-footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link href="/login">Log in</Link></li>
              <li><Link href="/register">Create account</Link></li>
              <li><Link href="/forgot">Reset password</Link></li>
            </ul>
          </div>

          <div className="ps-footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
            </ul>
          </div>
        </div>

        <div className="ps-footer-bottom">
          <span>© {new Date().getFullYear()} Flexaro Pvt Ltd · All rights reserved.</span>
          <div className="ps-footer-badges">
            <span className="ps-footer-badge">GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
