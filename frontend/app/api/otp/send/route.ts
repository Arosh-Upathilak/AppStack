import { z } from 'zod';
import { prisma } from '@/lib/db';
import { parseJson, ok, fail } from '@/lib/http';
import { issueOtp } from '@/lib/otp';
import { sendEmail, otpEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(['REGISTER', 'SUBSCRIBE_ALT_EMAIL', 'LOGIN']),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema);
  if (parsed instanceof Response) return parsed;
  const email = parsed.email.toLowerCase();

  // For REGISTER, user must exist but not yet be verified
  if (parsed.purpose === 'REGISTER') {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return fail('No pending registration for this email.', 404);
  }

  try {
    const code = await issueOtp(email, parsed.purpose);
    const { subject, html, text } = otpEmail(code);
    await sendEmail({ to: email, subject, html, text });
    return ok();
  } catch (e) {
    return fail((e as Error).message, 429);
  }
}
