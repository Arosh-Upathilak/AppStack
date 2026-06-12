'use client';

import React from 'react';

interface BadgeProps {
  tone?: 'soft' | 'success' | 'warning' | 'danger' | 'brand' | 'accent';
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Badge({ tone = 'soft', dot, children, style }: BadgeProps) {
  return (
    <span className={`badge badge-${tone}`} style={style}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
