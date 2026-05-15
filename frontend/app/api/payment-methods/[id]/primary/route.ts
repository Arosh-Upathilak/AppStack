import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/http';
import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole('BUYER');
  if (u instanceof NextResponse) return u;
  const { id } = await ctx.params;
  const userId = await resolveUserId(u);

  const pm = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!pm || pm.userId !== userId) return fail('Not found', 404);

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({ where: { userId }, data: { isPrimary: false } }),
    prisma.paymentMethod.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  return ok();
}

async function resolveUserId(u: { id: string; email: string }) {
  if (u.id !== 'bypass') return u.id;
  const real = await prisma.user.findUnique({ where: { email: u.email } });
  return real?.id ?? u.id;
}
