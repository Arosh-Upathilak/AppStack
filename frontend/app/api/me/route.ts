import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { email?: string | null; name?: string | null; role?: string[] | string; sellerStatus?: string | null }
    | undefined;

  if (!user?.email) {
    return NextResponse.json({});
  }

  const roles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];

  return NextResponse.json({
    email: user.email,
    name: user.name ?? null,
    roles,
    sellerStatus: user.sellerStatus ?? undefined,
  });
}
