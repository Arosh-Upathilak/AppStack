'use client';

import React from 'react';

const STATS = [
  { target: 10000, unit: '+',   label: 'Active subscribers', em: 'Active subscribers', rest: 'across 64 countries' },
  { target: 248,   unit: '',    label: 'Verified apps',       em: 'Verified apps',       rest: 'integrated and audited' },
  { target: 8,     unit: 'min', label: 'Average setup',       em: 'Average',             rest: 'setup, end‑to‑end' },
  { target: 71,    unit: '',    label: 'Customer NPS',        em: 'Customer NPS',        rest: ', last twelve months' },
];

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

export default function StatsBand() {
  const [vals, setVals] = React.useState(STATS.map(() => 0));
  const cellRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observers: IntersectionObserver[] = [];

    STATS.forEach((stat, i) => {
      const el = cellRefs.current[i];
      if (!el) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          if (prefersReduced) {
            setVals(prev => { const n = [...prev]; n[i] = stat.target; return n; });
            return;
          }
          const dur = 1700;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const v = Math.round(stat.target * easeOutCubic(t));
            setVals(prev => { const n = [...prev]; n[i] = v; return n; });
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.4 });
      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <section className="ps-stats">
      <div className="psite-wrap">
        <div className="ps-stats-grid">
          {STATS.map((s, i) => (
            <div key={s.label} className={`cell psite-reveal${i > 0 ? ` d${i}` : ''}`} ref={el => { cellRefs.current[i] = el; }}>
              <span className="ps-big-num">
                <span>{vals[i].toLocaleString('en-US')}</span>
                {s.unit && <span className="unit">{s.unit}</span>}
              </span>
              <span className="ps-big-label">
                <span className="em">{s.em}</span> {s.rest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
