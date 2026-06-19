const MARKS = [
  { name: 'Substrate',  glyph: <path d="M12 2 2 22h20L12 2z"/> },
  { name: 'Helios',     glyph: <circle cx="12" cy="12" r="10"/> },
  { name: 'Forge & Co.', glyph: <rect x="3" y="3" width="18" height="18" rx="2" fill="none" strokeWidth="2.5"/> },
  { name: 'Loftworks',  glyph: <path d="M12 2 22 7v10l-10 5L2 17V7l10-5z"/> },
  { name: 'Densely',    glyph: <path d="M3 12h6l3-9 3 18 3-9h3" fill="none" strokeWidth="2"/> },
  { name: 'Crosshatch', glyph: <><path d="M4 4l16 16M20 4 4 20" fill="none" strokeWidth="2.5"/></> },
  { name: 'Plinth',     glyph: <rect x="3" y="10" width="18" height="4"/> },
  { name: 'Bicameral',  glyph: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></> },
];

function Wordmark({ name, glyph }: { name: string; glyph: React.ReactNode }) {
  return (
    <div className="ps-wordmark">
      <span className="glyph">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
          {glyph}
        </svg>
      </span>
      {name}
    </div>
  );
}

import React from 'react';

export default function LogoMarquee() {
  return (
    <section className="ps-marquee-band">
      <div className="ps-marquee-label">A growing marketplace of SaaS products</div>
      <div className="ps-marquee">
        {[...MARKS, ...MARKS].map((m, i) => (
          <Wordmark key={i} name={m.name} glyph={m.glyph} />
        ))}
      </div>
    </section>
  );
}
