import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  companyName: z.string().min(1).max(200),
  payoutEmail: z.string().email(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.user.roles.includes('SELLER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.sellerProfile.update({
    where: { userId: session.user.id },
    data: {
      companyName: parsed.data.companyName,
      payoutEmail: parsed.data.payoutEmail,
    },
  });

  return NextResponse.json({ ok: true });
}
