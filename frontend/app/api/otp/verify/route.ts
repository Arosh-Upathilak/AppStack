import { z } from 'zod';
import { prisma } from '@/lib/db';
import { parseJson, ok, fail } from '@/lib/http';
import { verifyOtp } from '@/lib/otp';

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(['REGISTER', 'SUBSCRIBE_ALT_EMAIL', 'LOGIN']),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema);
  if (parsed instanceof Response) return parsed;

  const email = parsed.email.toLowerCase();
  const success = await verifyOtp(email, parsed.code, parsed.purpose);
  if (!success) return fail('Invalid or expired code.', 400);

  if (parsed.purpose === 'REGISTER') {
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  }
  return ok();
}
