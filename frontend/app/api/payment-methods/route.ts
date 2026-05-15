import { z } from 'zod';
import { prisma } from '@/lib/db';
import { parseJson, ok, fail } from '@/lib/http';
import { requireRole } from '@/lib/session';
import { stripeEnabled } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  const u = await requireRole('BUYER');
  if (u instanceof NextResponse) return u;
  // In bypass mode the demo buyer is the seeded one.
  const userId = await resolveUserId(u);
  const methods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });
  return ok({ methods, stripeEnabled });
}

const addSchema = z.object({
  // Simulator-only fields. With real Stripe these are replaced by a
  // confirmed SetupIntent payment_method id from the client.
  number: z.string().min(13).max(19),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2024).max(2100),
  cvc: z.string().min(3).max(4),
  setAsPrimary: z.boolean().optional(),
});

export async function POST(req: Request) {
  const u = await requireRole('BUYER');
  if (u instanceof NextResponse) return u;
  const userId = await resolveUserId(u);

  const parsed = await parseJson(req, addSchema);
  if (parsed instanceof NextResponse) return parsed;

  const digits = parsed.number.replace(/\D/g, '');
  if (!luhn(digits)) return fail('Card number is invalid.', 400);
  const brand = detectBrand(digits);
  const last4 = digits.slice(-4);

  // Simulator: fabricate a Stripe-like PM id. With real Stripe, accept
  // a previously-created pm_xxx id from the client instead.
  const stripePmId = `pm_sim_${Math.random().toString(36).slice(2, 14)}`;

  const becomesPrimary =
    parsed.setAsPrimary ||
    (await prisma.paymentMethod.count({ where: { userId } })) === 0;

  if (becomesPrimary) {
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.paymentMethod.create({
    data: {
      userId,
      stripePmId,
      brand,
      last4,
      expMonth: parsed.expMonth,
      expYear: parsed.expYear,
      isPrimary: becomesPrimary,
    },
  });
  return ok({ method: created });
}

async function resolveUserId(u: { id: string; email: string }) {
  if (u.id !== 'bypass') return u.id;
  const real = await prisma.user.findUnique({ where: { email: u.email } });
  return real?.id ?? u.id;
}

function luhn(s: string) {
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectBrand(d: string): string {
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^6(011|5)/.test(d)) return 'Discover';
  return 'Card';
}
