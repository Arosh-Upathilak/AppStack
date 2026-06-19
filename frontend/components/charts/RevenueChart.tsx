'use client';

interface RevenueChartProps {
  data: number[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const w = 720, h = 200, pad = 24;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const stepX = (w - pad * 2) / (data.length - 1);
  const yFor = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const bars = data.map((v, i) => ({ x: pad + i * stepX - 8, y: yFor(v), h: h - pad - yFor(v), v, i }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="revBarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {[0, 2500, 5000, 7500, 10000, 12500].map(t => (
        <g key={t}>
          <line x1={pad} y1={yFor(t)} x2={w - pad} y2={yFor(t)} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={4} y={yFor(t) + 3} fontSize="9" fill="var(--ink-4)" style={{ fontVariantNumeric: 'tabular-nums' }}>${(t / 1000).toFixed(0)}k</text>
        </g>
      ))}
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={16} height={Math.max(0, b.h)} rx="2"
              fill={i === bars.length - 1 ? 'var(--brand)' : 'url(#revBarFill)'}
              opacity={i === bars.length - 1 ? 1 : 0.6 + (i / bars.length) * 0.4} />
      ))}
      <text x={bars[bars.length - 1].x + 8} y={bars[bars.length - 1].y - 8}
            fontSize="11" fontWeight="600" fill="var(--brand)" textAnchor="middle"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
        $12,450
      </text>
    </svg>
  );
}
