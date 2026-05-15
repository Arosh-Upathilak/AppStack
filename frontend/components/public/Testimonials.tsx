'use client';

import React from 'react';

const QUOTES = [
  {
    body: 'AppStack cut our SaaS spend review from four hours a month to fifteen minutes. The dashboard pays for itself in the first week.',
    nm: 'Sarah Jenkins', rl: 'VP Engineering · TechCorp',
    av: 'SJ', grad: 'linear-gradient(135deg,#1247a9,#003d9b)',
  },
  {
    body: 'We used to miss renewals constantly. Now every subscription is visible, searchable, and quietly under control.',
    nm: 'Marcus Rivera', rl: 'CTO · LogisticsPro',
    av: 'MR', grad: 'linear-gradient(135deg,#7c3aed,#4c1d95)',
  },
  {
    body: 'As a seller, the webhook integration took thirty minutes. Our platform now activates customer plans automatically.',
    nm: 'Priya Shah', rl: 'Founder · Atlas SaaS',
    av: 'PS', grad: 'linear-gradient(135deg,#fb923c,#c2410c)',
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
          <span className="ps-sec-eyebrow">Customers</span>
          <h2 className="ps-sec-title">Loved by teams that <span className="accent">value their time</span>.</h2>
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
