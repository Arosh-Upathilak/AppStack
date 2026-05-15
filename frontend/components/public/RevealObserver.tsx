'use client';

import { useEffect } from 'react';

export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('in-view');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const observe = () => {
      document.querySelectorAll('.psite-reveal').forEach(el => io.observe(el));
    };

    observe();
    // Re-observe after a tick to catch any late-mounted elements
    const t = setTimeout(observe, 200);

    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return null;
}
