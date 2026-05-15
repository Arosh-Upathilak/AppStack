import { prisma } from '@/lib/db';
import { ok } from '@/lib/http';
import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const u = await requireRole('BUYER');
  if (u instanceof NextResponse) return u;
  const userId = await resolveUserId(u);

  const consents = await prisma.subscriptionConsent.findMany({
    where: { subscription: { buyerId: userId } },
    include: { subscription: { include: { product: true, plan: true } } },
    orderBy: { agreedAt: 'desc' },
  });
  return ok({
    consents: consents.map(c => ({
      id: c.id,
      type: c.type,
      agreedAt: c.agreedAt,
      ipAddress: c.ipAddress,
      product: c.subscription.product.title,
      plan: c.subscription.plan.name,
      recipientEmail: c.subscription.recipientEmail,
    })),
  });
}

async function resolveUserId(u: { id: string; email: string }) {
  if (u.id !== 'bypass') return u.id;
  const real = await prisma.user.findUnique({ where: { email: u.email } });
  return real?.id ?? u.id;
}
