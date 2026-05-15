'use client';

import React from 'react';

const CARDS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'Enterprise-grade security',
    desc: 'SOC 2 Type II certified. PII never exposed to sellers. GDPR-ready consent records, immutable audit trail, customer-managed keys on request.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
    title: 'Spend analytics',
    desc: 'Trajectory charts, MRR tracking, seat utilisation alerts and forecast projections — built on the same data model finance already trusts.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: 'Developer-first API',
    desc: 'A documented REST surface with a complete sandbox, generated SDKs in five languages, and idempotency baked in. Integrate in minutes, not weeks.',
  },
];

export default function SubFeatures() {
  return (
    <section className="ps-sub-feats">
      <div className="psite-wrap">
        <div className="ps-sub-feats-grid">
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className={`ps-sf psite-reveal${i > 0 ? ` d${i}` : ''}`}
              onMouseMove={e => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                (e.currentTarget as HTMLDivElement).style.setProperty('--mx', `${e.clientX - r.left}px`);
                (e.currentTarget as HTMLDivElement).style.setProperty('--my', `${e.clientY - r.top}px`);
              }}
            >
              <div className="ps-sf-ic">{c.icon}</div>
              <h4>{c.title}</h4>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
