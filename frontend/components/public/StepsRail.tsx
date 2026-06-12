'use client';

import React from 'react';

const STEPS = [
  { n: '01', title: 'Register', desc: 'Create a buyer or seller account in a few steps. Email is verified with a one-time code.' },
  { n: '02', title: 'Subscribe', desc: 'Browse the marketplace, pick a plan, save a card, and accept the consent to share your email with the seller.' },
  { n: '03', title: 'Manage', desc: 'Upgrade, downgrade or cancel from one dashboard. Refunds within 30 days, approved by an administrator.' },
];

export default function StepsRail() {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setActiveIdx(0);
      return;
    }
    const rail = railRef.current;
    if (!rail) return;

    const onScroll = () => {
      const r = rail.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end   = vh * 0.25;
      let raw = (start - r.top) / (start - end);
      raw = Math.max(0, Math.min(1, raw));
      const idx = Math.min(STEPS.length - 1, Math.floor(raw * STEPS.length));
      setActiveIdx(idx);
      setProgress(idx === 0 ? 0 : (idx / (STEPS.length - 1)) * 100);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="ps-steps-section">
      <div className="psite-wrap">
        <div className="ps-sec-head psite-reveal">
          <span className="ps-sec-eyebrow">How it works</span>
          <h2 className="ps-sec-title">Up and running in <span className="accent">minutes</span>.</h2>
          <p className="ps-sec-sub">Three steps to a fully managed subscription stack.</p>
        </div>

        <div
          className="ps-steps-rail"
          ref={railRef}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`ps-step${i === activeIdx ? ' active' : ''}${i < activeIdx ? ' done' : ''}`}
            >
              <div className="ps-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
