'use client';

import React from 'react';
import Link from 'next/link';

export default function CtaBlock() {
  const blockRef = React.useRef<HTMLElement>(null);
  const spotRef  = React.useRef<HTMLDivElement>(null);

  // Cursor spotlight
  React.useEffect(() => {
    const block = blockRef.current;
    const spot  = spotRef.current;
    if (!block || !spot) return;
    const onMove = (e: MouseEvent) => {
      const r = block.getBoundingClientRect();
      spot.style.transform = `translate(${e.clientX - r.left - 300}px, ${e.clientY - r.top - 300}px)`;
    };
    block.addEventListener('mousemove', onMove);
    return () => block.removeEventListener('mousemove', onMove);
  }, []);

  // Magnetic buttons
  React.useEffect(() => {
    const buttons = blockRef.current?.querySelectorAll<HTMLElement>('.ps-btn-light');
    if (!buttons) return;
    const cleanups: (() => void)[] = [];
    buttons.forEach(btn => {
      const onMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
      };
      const onLeave = () => { btn.style.transform = ''; };
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });
    return () => cleanups.forEach(f => f());
  }, []);

  return (
    <section className="ps-cta-block" ref={blockRef}>
      <div className="ps-cta-aurora">
        <div className="b ba"/>
        <div className="b bb"/>
      </div>
      <div className="ps-cta-grid-bg"/>
      <div className="ps-cta-spot" ref={spotRef}/>

      <div className="psite-wrap ps-cta-inner">
        <h2>Ready to simplify <span className="accent">your stack?</span></h2>
        <p>Start free — no credit card required. See every subscription in under five minutes.</p>
        <div className="ps-cta-buttons">
          <Link href="/register" className="ps-btn ps-btn-light" style={{ padding: '13px 26px', fontSize: 15 }}>
            Get started for free <span className="ps-arrow">→</span>
          </Link>
          <a href="mailto:sales@appstack.com?subject=AppStack%20sales%20enquiry" className="ps-btn ps-btn-ghost" style={{ padding: '13px 22px', fontSize: 15 }}>
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  );
}
