'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastHost, useToast } from './Toast';
import TweaksPanel from './tweaks/TweaksPanel';
import { useTweaks } from './tweaks/useTweaks';
import { PRODUCTS, SUBSCRIPTIONS } from '@/data/mock';

type ChromeRole = 'buyer' | 'seller' | 'admin';

interface DashboardChromeProps {
  role: ChromeRole;
  children: React.ReactNode;
}

function buildCrumbs(role: ChromeRole, pathname: string): string[] {
  const base = role === 'seller' ? 'Seller' : role === 'admin' ? 'Admin' : 'AppStack';
  const segs = pathname.split('/').filter(Boolean); // e.g. ['buyer','marketplace','flexaro-crm']

  if (role === 'buyer') {
    if (segs.length === 1) return [base, 'Overview'];
    if (segs[1] === 'marketplace') {
      if (segs[2]) {
        const p = PRODUCTS.find(x => x.id === segs[2]);
        return [base, 'Marketplace', p ? p.name : segs[2]];
      }
      return [base, 'Marketplace'];
    }
    if (segs[1] === 'subscriptions') {
      if (segs[2]) {
        const s = SUBSCRIPTIONS.find(x => x.id === segs[2]);
        return [base, 'Subscriptions', s ? s.name : segs[2]];
      }
      return [base, 'Subscriptions'];
    }
    if (segs[1] === 'invoices') return [base, 'Invoices'];
    if (segs[1] === 'settings') return [base, 'Settings'];
    if (segs[1] === 'become-seller') return [base, 'Become a Seller'];
  }

  if (role === 'seller') {
    if (segs.length === 1) return [base, 'Overview'];
    if (segs[1] === 'products') return [base, 'Products'];
    if (segs[1] === 'analytics') return [base, 'Analytics'];
    if (segs[1] === 'wallet') return [base, 'Wallet'];
    if (segs[1] === 'settings') return [base, 'Settings'];
  }

  if (role === 'admin') {
    if (segs.length === 1) return [base, 'Dashboard'];
    if (segs[1] === 'sellers') {
      if (segs[2] === 'pending') return [base, 'Sellers', 'Pending Approvals'];
      return [base, 'Sellers'];
    }
  }

  return [base];
}

export function useToastContext() {
  return React.useContext(ToastContext);
}

export const ToastContext = React.createContext<{
  toast: (msg: string, icon?: string) => void;
}>({ toast: () => {} });

export type { ChromeRole };

export default function DashboardChrome({ role, children }: DashboardChromeProps) {
  const pathname = usePathname();
  const { toasts, toast } = useToast();
  const [t, setTweak] = useTweaks();
  const crumbs = buildCrumbs(role, pathname);

  return (
    <ToastContext.Provider value={{ toast }}>
      <div
        className="app"
        data-density={t.density !== 'regular' ? t.density : undefined}
        data-accent={t.accent !== 'default' ? t.accent : undefined}
        data-card={t.card !== 'default' ? t.card : undefined}
      >
        <Sidebar role={role} />
        <div className="main">
          <Topbar crumbs={crumbs} />
          {children}
        </div>
        <ToastHost toasts={toasts} />
        <TweaksPanel t={t} setTweak={setTweak} />
      </div>
    </ToastContext.Provider>
  );
}
