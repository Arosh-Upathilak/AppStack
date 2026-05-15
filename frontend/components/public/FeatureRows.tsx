/* Feature rows with inline SVG visuals — ported from the design */

/* ── Hub visual ── */
function HubVis() {
  const cells = [
    { app: { bg: 'linear-gradient(135deg,#5e5ce6,#3b2bbf)', l: 'L' }, col: 0 },
    { app: null, col: 1 },
    { app: null, col: 2 },
    { app: { bg: 'linear-gradient(135deg,#a259ff,#7c2dd9)', l: 'F' }, col: 3 },
    { app: null, col: 0 },
    { center: true },
    { app: null, col: 2 },
    { app: null, col: 3 },
    { app: null, col: 0 },
    { app: null, col: 1 },
    { app: { bg: 'linear-gradient(135deg,#fb923c,#c2410c)', l: 'F' }, col: 2 },
    { app: null, col: 3 },
    { app: { bg: 'linear-gradient(135deg,#0d7a52,#04432d)', l: 'N' }, col: 0 },
    { app: null, col: 1 },
    { app: null, col: 2 },
    { app: { bg: 'linear-gradient(135deg,#611f69,#4a154b)', l: 'S' }, col: 3 },
  ];

  return (
    <div className="ps-vis-hub">
      <svg className="conn" viewBox="0 0 400 320" preserveAspectRatio="none">
        <path d="M60,60 L200,160"/>
        <path d="M340,60 L200,160"/>
        <path d="M60,260 L200,160"/>
        <path d="M340,260 L200,160"/>
        {[{ cx: 60, cy: 60, b: '0s' }, { cx: 340, cy: 60, b: '0.7s' }, { cx: 60, cy: 260, b: '1.4s' }, { cx: 340, cy: 260, b: '2.1s' }].map((d, i) => (
          <circle key={i} className="pulse" cx={d.cx} cy={d.cy} r="2.5">
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin={d.b}/>
          </circle>
        ))}
      </svg>
      {cells.map((c, i) =>
        c.center ? (
          <div key={i} className="ps-hub-cell center"><span className="core">A</span></div>
        ) : c.app ? (
          <div key={i} className="ps-hub-cell">
            <span className="glyph" style={{ background: c.app.bg }}>{c.app.l}</span>
          </div>
        ) : (
          <div key={i} className="ps-hub-cell"/>
        )
      )}
    </div>
  );
}

/* ── Billing visual ── */
function BillVis() {
  return (
    <div className="ps-vis-bill">
      <div className="ps-receipt">
        <div className="ps-receipt-head">
          <div className="biz">AppStack · May 2026</div>
          <div className="num">INV-04812</div>
        </div>
        {[
          { l: 'Linear · 12 seats', v: '$96.00' },
          { l: 'Figma · 16 seats', v: '$240.00' },
          { l: 'Notion · 20 seats', v: '$160.00' },
          { l: 'Slack · 26 seats', v: '$312.00' },
          { l: 'Proration credit', v: '−$12.00', green: true },
        ].map(r => (
          <div key={r.l} className="ps-receipt-line">
            <span className="lbl">{r.l}</span>
            <span className="val" style={r.green ? { color: '#0d7a52' } : {}}>{r.v}</span>
          </div>
        ))}
        <div className="ps-receipt-total">
          <span className="lbl">Auto-charged</span>
          <span className="val">$796.00</span>
        </div>
        <div className="ps-receipt-status">
          <span className="check">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Paid via Stripe · 142ms
        </div>
      </div>
    </div>
  );
}

/* ── Webhook flow visual ── */
function FlowVis() {
  return (
    <div className="ps-vis-flow">
      <svg viewBox="0 0 480 380" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="psGNode" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff"/>
            <stop offset="100%" stopColor="#f4f6fa"/>
          </linearGradient>
        </defs>
        {/* Source */}
        <g>
          <rect x="40" y="160" width="120" height="60" rx="10" fill="url(#psGNode)" stroke="#dde1ea"/>
          <text x="100" y="184" textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="600" fill="#0a0d1a">AppStack</text>
          <text x="100" y="202" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#6b7392">subscription.updated</text>
        </g>
        {/* Targets */}
        {[
          { y: 60,  label: 'Your API',    sub: '200 OK · 142ms' },
          { y: 165, label: 'Provisioner', sub: '200 OK · 88ms'  },
          { y: 270, label: 'Analytics',   sub: '200 OK · 51ms'  },
        ].map(t => (
          <g key={t.y}>
            <rect x="320" y={t.y} width="120" height="50" rx="10" fill="url(#psGNode)" stroke="#dde1ea"/>
            <text x="380" y={t.y + 22} textAnchor="middle" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#0a0d1a">{t.label}</text>
            <text x="380" y={t.y + 38} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#0d7a52">{t.sub}</text>
          </g>
        ))}
        {/* Connectors */}
        <path id="ps-path-a" d="M160,180 C220,180 260,90 320,85"  fill="none" stroke="#003d9b" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.35"/>
        <path id="ps-path-b" d="M160,190 C220,190 260,190 320,190" fill="none" stroke="#003d9b" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.35"/>
        <path id="ps-path-c" d="M160,200 C220,200 260,290 320,295" fill="none" stroke="#003d9b" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.35"/>
        {/* Traveling dots */}
        {[
          { href: '#ps-path-a', color: '#003d9b', begin: '0s' },
          { href: '#ps-path-b', color: '#4a7bd6', begin: '0.9s' },
          { href: '#ps-path-c', color: '#6ad0de', begin: '1.8s' },
        ].map((d, i) => (
          <circle key={i} r="3.5" fill={d.color}>
            <animateMotion dur="2.8s" begin={d.begin} repeatCount="indefinite"><mpath href={d.href}/></animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" begin={d.begin} repeatCount="indefinite" keyTimes="0;0.1;0.85;1"/>
          </circle>
        ))}
        {/* Source pulse ring */}
        <circle cx="100" cy="190" r="6" fill="none" stroke="#003d9b" strokeWidth="1.5">
          <animate attributeName="r" values="6;28;6" dur="2.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
}

const ROWS = [
  {
    eyebrow: 'Unified dashboard',
    title: 'Manage every subscription from one place.',
    body: 'Discover SaaS products, subscribe, upgrade, downgrade or cancel — all from a single buyer dashboard, with invoices kept on file for years.',
    bullets: [
      'Upgrade, downgrade or cancel any plan from one dashboard.',
      'Subscribe to a plan for a different email, verified by OTP.',
      'Invoice history retained and downloadable for 5+ years.',
    ],
    cta: { label: 'Explore the marketplace', href: '/marketplace' },
    visual: <HubVis />,
    reverse: false,
  },
  {
    eyebrow: 'Automated billing',
    title: 'Scheduled payments and approved refunds.',
    body: 'Subscriptions renew automatically on schedule. Failed charges retry up to three times. Buyers can request a refund within 30 days, approved by an administrator.',
    bullets: [
      'Multiple saved cards with a primary card.',
      'Up to three automatic retries on failed charges.',
      '30-day refund window, administrator-approved.',
    ],
    cta: { label: 'How billing works', href: '/about' },
    visual: <BillVis />,
    reverse: true,
  },
  {
    eyebrow: 'For sellers',
    title: 'A REST API and webhooks for your SaaS.',
    body: 'When a buyer subscribes, AppStack calls your webhook to activate the plan. Subscribe, change and cancel events all flow through — with a sandbox environment for testing before go-live.',
    bullets: [
      'Webhook events for subscribe, change and cancel.',
      'RESTful endpoint for sending events back to AppStack.',
      'Sandbox environment for end-to-end testing.',
    ],
    cta: { label: 'Sell on AppStack', href: '/register' },
    visual: <FlowVis />,
    reverse: false,
  },
];

export default function FeatureRows() {
  return (
    <section className="ps-features" id="features">
      <div className="psite-wrap">
        <div className="ps-sec-head psite-reveal">
          <span className="ps-sec-eyebrow">The platform</span>
          <h2 className="ps-sec-title">Everything your stack <span className="accent">needs</span>, nothing it doesn&apos;t.</h2>
          <p className="ps-sec-sub">A small, opinionated set of primitives that compose into the subscription operations your team actually uses.</p>
        </div>

        {ROWS.map((row, i) => (
          <div key={i} className={`ps-feature-row psite-reveal${row.reverse ? ' reverse' : ''}`}>
            <div className="ps-feat-copy">
              <span className="ps-feat-eyebrow">{row.eyebrow}</span>
              <h3>{row.title}</h3>
              <p>{row.body}</p>
              <ul className="ps-feat-bullets">
                {row.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
              <a href={row.cta.href} className="ps-feat-cta">
                {row.cta.label} <span className="arrow">→</span>
              </a>
            </div>
            <div className="ps-feat-vis">
              {row.visual}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
