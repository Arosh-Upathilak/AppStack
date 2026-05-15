'use client';

import React from 'react';

interface TweakRadioProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export default function TweakRadio({ label, value, options, onChange }: TweakRadioProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const n = options.length;
  const idx = Math.max(0, options.indexOf(value));

  const segAt = (clientX: number) => {
    if (!trackRef.current) return options[0];
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return options[Math.max(0, Math.min(n - 1, i))];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{
               left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
               width: `calc((100% - 4px) / ${n})`,
             }} />
        {options.map(o => (
          <button key={o} type="button" role="radio" aria-checked={o === value}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
