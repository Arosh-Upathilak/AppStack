'use client';

import React from 'react';
import Icon from './Icon';

export interface ToastItem {
  id: number;
  msg: string;
  icon?: string;
}

export type ToastFn = (msg: string, icon?: string) => void;

interface ToastHostProps {
  toasts: ToastItem[];
}

export function ToastHost({ toasts }: ToastHostProps) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div className="toast" key={t.id}>
          <Icon name={(t.icon || 'check_circle') as Parameters<typeof Icon>[0]['name']} size={16} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast: ToastFn = React.useCallback((msg, icon = 'check_circle') => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, msg, icon }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 2800);
  }, []);

  return { toasts, toast };
}
