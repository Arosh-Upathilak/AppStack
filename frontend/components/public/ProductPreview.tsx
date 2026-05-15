'use client';

import React from 'react';

const APPS = [
  { name: 'Linear',  meta: 'Project tracking', cost: '$96',  seats: '12 seats', status: 'status-active', statusLabel: 'Active',      ic: 'linear-gradient(135deg,#5e5ce6,#3b2bbf)', letter: 'L' },
  { name: 'Figma',   meta: 'Design platform',  cost: '$240', seats: '16 seats', status: 'status-renew',  statusLabel: 'Renews 3d',   ic: 'linear-gradient(135deg,#a259ff,#7c2dd9)', letter: 'F' },
  { name: 'Notion',  meta: 'Workspace',         cost: '$160', seats: '20 seats', status: 'status-active', statusLabel: 'Active',      ic: 'linear-gradient(135deg,#1f1f1f,#000)',    letter: 'N' },
  { name: 'Slack',   meta: 'Comms',             cost: '$312', seats: '26 seats', status: 'status-attn',   statusLabel: 'Over budget', ic: 'linear-gradient(135deg,#611f69,#4a154b)', letter: 'S' },
];

const STATS = [
  { label: 'MRR',       num: 38420, prefix: '$', delta: '↑ 12% vs last mo.' },
  { label: 'Subs',      num: 42,    prefix: '',  delta: 'across 8 teams' },
  { label: 'Seats',     num: 186,   prefix: '',  delta: '/ 240 allocated' },
  { label: 'Renew 30d', num: 7,     prefix: '',  delta: '$4,210 value' },
];

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

export default function ProductPreview() {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const toastRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const mrrRef = React.useRef<HTMLDivElement>(null);

  const [statVals, setStatVals] = React.useState(STATS.map(() => 0));
  const [mrrCurrent, setMrrCurrent] = React.useState(38420);
  const animated = React.useRef(false);
  const liveTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const liveIdx = React.useRef(0);

  // Animate stat counters once visible
  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = stageRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting || animated.current) return;
        animated.current = true;

        if (prefersReduced) {
          setStatVals(STATS.map(s => s.num));
          return;
        }

        STATS.forEach((stat, i) => {
          const dur = 1700;
          const delay = i * 80;
          const start = performance.now() + delay;
          const tick = (now: number) => {
            if (now < start) { requestAnimationFrame(tick); return; }
            const t = Math.min(1, (now - start) / dur);
            const v = Math.round(stat.num * easeOutCubic(t));
            setStatVals(prev => {
              const next = [...prev];
              next[i] = v;
              return next;
            });
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });

        // start live loop
        liveTimer.current = setInterval(() => {
          const row = rowRefs.current[liveIdx.current % rowRefs.current.length];
          if (row) {
            row.classList.add('flash');
            setTimeout(() => row.classList.remove('flash'), 1200);
          }
          setMrrCurrent(prev => prev + Math.floor(Math.random() * 60) + 20);
          if (liveIdx.current % 3 === 1 && toastRef.current) {
            toastRef.current.classList.add('show');
            setTimeout(() => toastRef.current?.classList.remove('show'), 3000);
          }
          liveIdx.current++;
        }, 3200);
      });
    }, { threshold: 0.3 });

    io.observe(el);
    return () => {
      io.disconnect();
      if (liveTimer.current) clearInterval(liveTimer.current);
    };
  }, []);

  // Mouse parallax tilt
  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const stage = stageRef.current;
    const preview = previewRef.current;
    if (!stage || !preview) return;

    let rect = stage.getBoundingClientRect();
    const updateRect = () => { rect = stage.getBoundingClientRect(); };
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    let raf: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (e.clientY > rect.bottom + 100) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        preview.style.transform = `rotateX(${6 - dy * 3}deg) rotateY(${dx * 3}deg)`;
      });
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, []);

  return (
    <div className="ps-preview-stage" ref={stageRef}>
      <div className="ps-preview" ref={previewRef}>
        {/* Chrome bar */}
        <div className="ps-pv-chrome">
          <div className="ps-pv-traffic"><span/><span/><span/></div>
          <div className="ps-pv-url">appstack.io / workspace / overview</div>
          <div className="ps-pv-pill">Live</div>
        </div>

        <div className="ps-pv-body">
          {/* Sidebar */}
          <aside className="ps-pv-side">
            <div className="ps-pv-label">Workspace</div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Overview
            </div>
            <div className="ps-pv-item active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Subscriptions
            </div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Invoices
            </div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Marketplace
            </div>
            <div className="ps-pv-label">Insights</div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Spend
            </div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              Renewals
            </div>
            <div className="ps-pv-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
              Seats
            </div>
          </aside>

          {/* Main content */}
          <div className="ps-pv-main">
            <div className="ps-pv-title-row">
              <div className="ps-pv-title">Subscriptions</div>
              <div className="ps-pv-aux">42 ACTIVE · Q2 2026</div>
            </div>

            {/* Stats */}
            <div className="ps-pv-stats">
              {STATS.map((s, i) => (
                <div key={s.label} className="ps-pv-stat">
                  <div className="l">{s.label}</div>
                  <div className="v" ref={i === 0 ? mrrRef : undefined}>
                    {i === 0
                      ? `$${mrrCurrent.toLocaleString('en-US')}`
                      : `${s.prefix}${statVals[i].toLocaleString('en-US')}`
                    }
                  </div>
                  <div className="d">
                    {i === 0 ? <><span className="up">↑ 12%</span> vs last mo.</> : s.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="ps-pv-chart">
              <svg viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="psGArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003d9b" stopOpacity="0.22"/>
                    <stop offset="100%" stopColor="#003d9b" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <g className="grid">
                  <line x1="0" y1="25" x2="400" y2="25"/>
                  <line x1="0" y1="55" x2="400" y2="55"/>
                  <line x1="0" y1="85" x2="400" y2="85"/>
                </g>
                <path className="area" d="M0,82 C30,78 60,72 90,64 C120,56 150,60 180,52 C210,44 240,38 270,32 C300,26 330,20 360,18 L400,14 L400,100 L0,100 Z"/>
                <path className="line" d="M0,82 C30,78 60,72 90,64 C120,56 150,60 180,52 C210,44 240,38 270,32 C300,26 330,20 360,18 L400,14"/>
                <circle className="dot-pulse" cx="400" cy="14" r="4"/>
                <circle className="dot" cx="400" cy="14" r="3"/>
              </svg>
            </div>

            {/* App list */}
            <div className="ps-pv-list">
              {APPS.map((app, i) => (
                <div
                  key={app.name}
                  className="ps-pv-row"
                  ref={el => { rowRefs.current[i] = el; }}
                >
                  <div className="ps-pv-app">
                    <span className="ic" style={{ background: app.ic }}>{app.letter}</span>
                    <div>{app.name}<div className="meta">{app.meta}</div></div>
                  </div>
                  <div className="ps-pv-cost">{app.cost}<span style={{ color: 'var(--ps-ink-4)', fontSize: 11 }}>/mo</span></div>
                  <div className="ps-pv-seats">{app.seats}</div>
                  <div>
                    <span className={`ps-pv-status ps-${app.status}`}>
                      <span className="pd"/>
                      {app.statusLabel}
                    </span>
                  </div>
                  <div className="ps-pv-chev">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Toast */}
            <div className="ps-pv-toast" ref={toastRef}>
              <span className="tic">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>Figma renewed</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>$240 charged · 16 seats</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
