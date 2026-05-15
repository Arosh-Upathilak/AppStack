'use client';

const palettes: Record<string, [string, string]> = {
  cloudsync:    ['#1e6ff5', '#0b3ea8'],
  teamsync:     ['#0fb6c4', '#0b6b75'],
  secureguard:  ['#16a34a', '#0f5a2d'],
  pixelgrid:    ['#fb8b1c', '#c46708'],
  metricsync:   ['#9f1ae0', '#5d0a89'],
  jira:         ['#3b82f6', '#1d4ed8'],
  figma:        ['#f24e1e', '#a743b6'],
  confluence:   ['#3b82f6', '#0747a6'],
  datadog:      ['#7c3aed', '#4c1d95'],
  notion:       ['#0a1330', '#2c3656'],
  intercom:     ['#1e6ff5', '#003d9b'],
  twilio:       ['#ed3d3d', '#a32424'],
  stripe:       ['#635bff', '#3a32d6'],
  linear:       ['#5e6ad2', '#3743a8'],
  flexaro:      ['#06b6d4', '#0b6f87'],
  nexus:        ['#0a1330', '#1e3866'],
  buildmaster:  ['#374151', '#0a1330'],
  cloudguard:   ['#0ea5b7', '#075f6c'],
};

interface AppLogoProps {
  name: string;
  hue: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AppLogo({ name, hue, size = 'md' }: AppLogoProps) {
  const [a, b] = palettes[hue] ?? ['#003d9b', '#0a1330'];
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className={`app-icon ${size}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      {initial}
    </div>
  );
}
