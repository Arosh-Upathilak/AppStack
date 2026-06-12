'use client';

interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: string;
}

export default function Sparkline({
  data,
  w = 200,
  h = 32,
  color = 'var(--brand)',
  fill = 'var(--brand-soft)',
}: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" style={{ width: '100%', height: h }} preserveAspectRatio="none">
      <polyline points={areaPoints} fill={fill} stroke="none" opacity="0.5" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
