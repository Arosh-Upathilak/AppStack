import { NextResponse } from 'next/server';
import { auth, type Role } from './auth';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  emailVerified: boolean;
  sellerStatus?: string;
};

const BYPASS = process.env.AUTH_BYPASS === '1';

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    roles: session.user.roles ?? [],
    emailVerified: session.user.emailVerified ?? false,
    sellerStatus: session.user.sellerStatus,
  };
}

export async function requireUser(): Promise<SessionUser | NextResponse> {
  if (BYPASS) {
    return {
      id: 'bypass',
      email: 'buyer@example.com',
      name: 'Sarah Kim',
      roles: ['BUYER', 'SELLER', 'ADMIN'],
      emailVerified: true,
    };
  }
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return u;
}

export async function requireRole(role: Role): Promise<SessionUser | NextResponse> {
  const u = await requireUser();
  if (u instanceof NextResponse) return u;
  if (!u.roles.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return u;
}
