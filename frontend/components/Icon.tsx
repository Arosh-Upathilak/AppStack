'use client';

import React from 'react';

type IconName =
  | 'home' | 'grid' | 'store' | 'compass' | 'box' | 'receipt' | 'chart' | 'wallet'
  | 'settings' | 'bell' | 'search' | 'arrow_up' | 'arrow_down' | 'arrow_right' | 'arrow_left'
  | 'chevron_right' | 'chevron_down' | 'chevron_up' | 'plus' | 'minus' | 'check' | 'check_circle'
  | 'x' | 'info' | 'warn' | 'shield' | 'sparkle' | 'filter' | 'download' | 'external' | 'star'
  | 'users' | 'cube' | 'code' | 'play' | 'book' | 'layers' | 'bolt' | 'bank' | 'calendar'
  | 'refresh' | 'trash' | 'edit' | 'copy' | 'eye' | 'eye_off' | 'link' | 'cloud' | 'flask'
  | 'cpu' | 'target' | 'inbox' | 'activity' | 'moon' | 'sun' | 'logout' | 'menu' | 'help'
  | 'mail' | 'lock' | 'tag' | 'package' | 'rocket' | 'clock';

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'stroke'> {
  name: IconName;
  size?: number;
  stroke?: number;
}

export default function Icon({ name, size = 16, stroke = 1.75, ...rest }: IconProps) {
  const s = size;
  const svgProps = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    ...rest,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></>,
    store: <><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 14h6"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></>,
    box: <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>,
    receipt: <><path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    chart: <><path d="M3 20h18"/><rect x="6" y="11" width="3" height="7" rx="0.5"/><rect x="11" y="6" width="3" height="12" rx="0.5"/><rect x="16" y="14" width="3" height="4" rx="0.5"/></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="15" r="1.2" fill="currentColor"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10.5 21a2 2 0 0 0 3 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    arrow_up: <><path d="M7 17L17 7"/><path d="M7 7h10v10"/></>,
    arrow_down: <><path d="M17 7L7 17"/><path d="M17 17H7V7"/></>,
    arrow_right: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrow_left: <><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></>,
    chevron_right: <path d="M9 6l6 6-6 6"/>,
    chevron_down: <path d="M6 9l6 6 6-6"/>,
    chevron_up: <path d="M6 15l6-6 6 6"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    check: <path d="M5 12l5 5L20 7"/>,
    check_circle: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8.5v.01M11 12h1v5h1"/></>,
    warn: <><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.5v.01"/></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></>,
    sparkle: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    filter: <><path d="M4 5h16M7 12h10M10 19h4"/></>,
    download: <><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>,
    external: <><path d="M14 5h5v5"/><path d="M19 5l-9 9"/><path d="M19 14v5H5V5h5"/></>,
    star: <path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3 6.5 20.3l1.1-6.3L3 9.6l6.3-.9z"/>,
    users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M14 18.5c.4-2.5 2.5-3.5 5-3.5s4 1.5 4 4"/></>,
    cube: <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/><path d="M7.5 5l9 4"/></>,
    code: <><path d="M9 7l-6 5 6 5"/><path d="M15 7l6 5-6 5"/><path d="M13 4l-2 16"/></>,
    play: <path d="M6 4l14 8-14 8z"/>,
    book: <><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h11"/></>,
    layers: <><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></>,
    bolt: <path d="M13 3L4 14h7l-1 7 9-11h-7z"/>,
    bank: <><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M9 14v3M12 14v3M15 14v3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.4L3 16"/><path d="M3 21v-5h5"/></>,
    trash: <><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4h6v3"/></>,
    edit: <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    eye_off: <><path d="M3 3l18 18"/><path d="M10.6 6.1c.5-.1.9-.1 1.4-.1 6.5 0 10 7 10 7s-.7 1.5-2.2 3.2"/><path d="M6.6 6.7C3.6 8.4 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    link: <><path d="M10 13l-2 2a4 4 0 0 0 5.7 5.7l3-3a4 4 0 0 0-5.7-5.7"/><path d="M14 11l2-2a4 4 0 0 0-5.7-5.7l-3 3a4 4 0 0 0 5.7 5.7"/></>,
    cloud: <><path d="M7 18a5 5 0 0 1-.5-9.9 6 6 0 0 1 11.4 1.5A4 4 0 0 1 17 18z"/></>,
    flask: <><path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3"/><path d="M7 14h10"/></>,
    cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>,
    inbox: <><path d="M3 14l3-9h12l3 9"/><path d="M3 14v6h18v-6"/><path d="M3 14h5l1 3h6l1-3h5"/></>,
    activity: <path d="M3 12h4l3-9 4 18 3-9h4"/>,
    moon: <path d="M21 13a8 8 0 0 1-11-11 8 8 0 1 0 11 11z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></>,
    logout: <><path d="M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17v.01"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    tag: <><path d="M3 12V3h9l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></>,
    package: <><path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>,
    rocket: <><path d="M5 19c0-7 6-15 14-15 0 8-8 14-15 14"/><path d="M9 11l4 4"/><circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  };

  return <svg {...svgProps}>{paths[name] ?? null}</svg>;
}
