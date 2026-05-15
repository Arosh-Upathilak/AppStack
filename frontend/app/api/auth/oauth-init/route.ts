import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';

const bodySchema = z.object({
  role: z.enum(['BUYER', 'SELLER']),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set('as_oauth_role', parsed.data.role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes — long enough to survive the OAuth redirect
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
