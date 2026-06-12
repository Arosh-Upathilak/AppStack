'use client';

import React from 'react';

const QUOTES = [
  {
    body: 'Browse a catalog of SaaS products, subscribe in a click, and manage every active plan, invoice and saved card from a single dashboard. Cancel or upgrade any time.',
    nm: 'For buyers', rl: 'Subscribe · manage · request refunds',
    av: 'B', grad: 'linear-gradient(135deg,#1247a9,#003d9b)',
  },
  {
    body: 'List your SaaS, set plans and pricing, and let AppStack handle payment collection, retries and invoicing. Track sales, refunds and payouts from the seller dashboard.',
    nm: 'For sellers', rl: 'List products · collect payments · withdraw earnings',
    av: 'S', grad: 'linear-gradient(135deg,#7c3aed,#4c1d95)',
  },
  {
    body: 'A documented REST API and signed webhooks for activating, changing and cancelling subscriptions. Test end-to-end in a sandbox environment before going live.',
    nm: 'For developers', rl: 'REST API · webhooks · sandbox',
    av: 'D', grad: 'linear-gradient(135deg,#fb923c,#c2410c)',
  },
];

export default function Testimonials() {
  const [idx, setIdx] = React.useState(0);
  const [fading, setFading] = React.useState(false);
  const autoRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const goto = React.useCallback((i: number) => {
    setFading(true);
    setTimeout(() => {
      setIdx(i);
      setFading(false);
    }, 320);
  }, []);

  const startAuto = React.useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % QUOTES.length;
        goto(next);
        return prev;
      });
    }, 6500);
  }, [goto]);

  React.useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [startAuto]);

  const q = QUOTES[idx];

  return (
    <section className="ps-testi">
      <div className="psite-wrap">
        <div className="ps-sec-head psite-reveal">
          <span className="ps-sec-eyebrow">Built for</span>
          <h2 className="ps-sec-title">Three sides, <span className="accent">one platform</span>.</h2>
        </div>

        <div
          className="ps-testi-card psite-reveal"
          onMouseEnter={() => { if (autoRef.current) clearInterval(autoRef.current); }}
          onMouseLeave={startAuto}
        >
          <div className="ps-testi-mark">&ldquo;</div>

          <p className={`ps-testi-body${fading ? ' ps-testi-fade' : ''}`}>
            {q.body}
          </p>

          <div className={`ps-testi-attr${fading ? ' ps-testi-fade' : ''}`}>
            <div className="av" style={{ background: q.grad }}>{q.av}</div>
            <div className="who">
              <div className="nm">{q.nm}</div>
              <div className="rl">{q.rl}</div>
            </div>
          </div>

          <div className="ps-testi-dots">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                className={i === idx ? 'active' : ''}
                aria-label={`Quote ${i + 1}`}
                onClick={() => goto(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
