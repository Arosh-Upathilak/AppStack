'use client';

import { usePathname } from 'next/navigation';
import PublicFooter from './PublicFooter';

const HIDDEN_PREFIXES = ['/login', '/register', '/forgot', '/reset'];

export default function PublicFooterSlot() {
  const pathname = usePathname() ?? '';
  if (HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }
  return <PublicFooter />;
}
