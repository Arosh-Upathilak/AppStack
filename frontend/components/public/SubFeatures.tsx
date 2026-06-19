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
    title: 'Privacy by design',
    desc: 'GDPR-aligned consent recorded per subscription. Buyer PII is never shown to sellers. Cards stored with our PCI-compliant processor — never on our servers. Cloudflare-proxied and reCAPTCHA-protected.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Reviewed by admins',
    desc: 'Sellers are manually approved before going live. New products and product edits go through an admin review before they reach the public marketplace.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: 'REST API & webhooks',
    desc: 'Sellers get a documented REST API and webhooks to integrate their SaaS with AppStack. A sandbox environment is available for testing before going live.',
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
