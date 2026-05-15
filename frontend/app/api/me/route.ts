import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ authenticated: false }, { status: 200 });
  return NextResponse.json({
    authenticated: true,
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles: session.user.roles ?? [],
    sellerStatus: session.user.sellerStatus,
  });
}
