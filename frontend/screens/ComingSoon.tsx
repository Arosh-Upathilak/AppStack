'use client';

import Icon from '@/components/Icon';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="page screen-enter" style={{ display: 'grid', placeItems: 'center', minHeight: 500 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Icon name="sparkle" size={28} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>This screen is coming soon. Explore the other screens while we build it out.</p>
      </div>
    </div>
  );
}
