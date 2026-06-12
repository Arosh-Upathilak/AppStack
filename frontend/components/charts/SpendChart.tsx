'use client';

interface SpendChartProps {
  data: number[];
  months: string[];
}

export default function SpendChart({ data, months }: SpendChartProps) {
  const w = 720, h = 200, pad = 24;
  const max = Math.max(...data) * 1.15;
  const min = 0;
  const stepX = (w - pad * 2) / (data.length - 1);
  const yFor = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const points = data.map((v, i) => `${pad + i * stepX},${yFor(v)}`).join(' ');
  const areaPoints = `${pad},${h - pad} ${points} ${pad + (data.length - 1) * stepX},${h - pad}`;
  const projectedX = pad + (data.length - 1) * stepX;
  const projectedY = yFor(4580);
  const yTicks = [0, 1000, 2000, 3000, 4000];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={pad} y1={yFor(t)} x2={w - pad} y2={yFor(t)} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={4} y={yFor(t) + 3} fontSize="9" fill="var(--ink-4)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ${(t / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      <polygon points={areaPoints} fill="url(#spendFill)" />
      <polyline points={points} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={projectedX} y1={yFor(data[data.length - 1])}
            x2={projectedX + stepX} y2={projectedY}
            stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx={projectedX + stepX} cy={projectedY} r="3" fill="var(--accent)" />
      <text x={projectedX + stepX} y={projectedY - 8} fontSize="10" fontWeight="600" fill="var(--accent)" textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>
        $4,580 forecast
      </text>
      {data.map((v, i) => (
        <circle key={i} cx={pad + i * stepX} cy={yFor(v)} r={i === data.length - 1 ? 4 : 2.5}
                fill={i === data.length - 1 ? 'var(--brand)' : 'var(--surface)'}
                stroke="var(--brand)" strokeWidth="1.5" />
      ))}
      <text x={pad + (data.length - 1) * stepX} y={yFor(data[data.length - 1]) - 10}
            fontSize="11" fontWeight="600" fill="var(--brand)" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
        $4,250
      </text>
      {months.map((m, i) => (
        <text key={m} x={pad + i * stepX} y={h - 6} fontSize="9.5" fill="var(--ink-4)" textAnchor="middle">
          {m}
        </text>
      ))}
    </svg>
  );
}
