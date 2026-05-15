'use client';

import React from 'react';
import TweakRadio from './TweakRadio';
import { TweakValues } from './useTweaks';

const PANEL_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.9);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;overflow-wrap:anywhere}
  .twk-open-btn{position:fixed;right:16px;bottom:16px;z-index:2147483645;
    width:40px;height:40px;border-radius:12px;border:1px solid rgba(0,0,0,.12);
    background:rgba(250,249,247,.9);backdrop-filter:blur(12px);
    box-shadow:0 2px 8px rgba(0,0,0,.14);cursor:pointer;font-size:16px;
    display:grid;place-items:center;color:#29261b}
  .twk-open-btn:hover{background:rgba(250,249,247,1)}
`;

interface TweaksPanelProps {
  t: TweakValues;
  setTweak: <K extends keyof TweakValues>(key: K, val: TweakValues[K]) => void;
}

export default function TweaksPanel({ t, setTweak }: TweaksPanelProps) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <>
      <style>{PANEL_STYLE}</style>
      {!open && (
        <button className="twk-open-btn" onClick={() => setOpen(true)} title="Open tweaks">
          ✦
        </button>
      )}
      {open && (
        <div ref={dragRef} className="twk-panel"
             style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
          <div className="twk-hd" onMouseDown={onDragStart}>
            <b>Tweaks</b>
            <button className="twk-x" aria-label="Close tweaks"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">
            <div className="twk-sect">Theme</div>
            <TweakRadio label="Accent" value={t.accent}
              options={['default', 'teal', 'violet', 'emerald', 'onyx']}
              onChange={v => setTweak('accent', v as TweakValues['accent'])} />
            <div className="twk-sect">Layout</div>
            <TweakRadio label="Density" value={t.density}
              options={['compact', 'regular', 'comfy']}
              onChange={v => setTweak('density', v as TweakValues['density'])} />
            <TweakRadio label="Cards" value={t.card}
              options={['default', 'flat', 'shadow']}
              onChange={v => setTweak('card', v as TweakValues['card'])} />
          </div>
        </div>
      )}
    </>
  );
}
