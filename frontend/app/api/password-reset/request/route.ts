import { z } from 'zod';
import { prisma } from '@/lib/db';
import { parseJson, ok } from '@/lib/http';
import { issueResetToken } from '@/lib/passwordReset';
import { sendEmail, passwordResetEmail } from '@/lib/email';
import { verifyRecaptcha } from '@/lib/recaptcha';

const schema = z.object({
  email: z.string().email(),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema);
  if (parsed instanceof Response) return parsed;
  const captchaOk = await verifyRecaptcha(parsed.recaptchaToken);
  // Always return ok to avoid email enumeration.
  if (!captchaOk) return ok();

  const email = parsed.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await issueResetToken(user.id);
    const url = `${process.env.AUTH_URL || 'http://localhost:3000'}/reset?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = passwordResetEmail(url);
    await sendEmail({ to: email, subject, html, text });
  }
  return ok();
}
