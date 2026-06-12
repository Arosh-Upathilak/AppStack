'use client';

import Icon from './Icon';
import Sparkline from './Sparkline';

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'flat';
  icon?: string;
  sub?: string;
  sparkData?: number[];
}

export default function StatTile({ label, value, delta, deltaDir = 'flat', icon, sub, sparkData }: StatTileProps) {
  return (
    <div className="stat-tile">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="stat-label">{label}</div>
        {icon && <div style={{ color: 'var(--ink-4)' }}><Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} /></div>}
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div className="stat-val">{value}</div>
        {delta && (
          <span className={`stat-delta ${deltaDir}`}>
            <Icon
              name={deltaDir === 'up' ? 'arrow_up' : deltaDir === 'down' ? 'arrow_down' : 'arrow_right'}
              size={12}
            />
            {delta}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: -2 }}>{sub}</div>}
      {sparkData && <Sparkline data={sparkData} />}
    </div>
  );
}
