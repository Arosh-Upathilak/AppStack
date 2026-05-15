import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { parseJson, ok, fail } from '@/lib/http';
import { issueOtp } from '@/lib/otp';
import { sendEmail, otpEmail } from '@/lib/email';
import { verifyRecaptcha } from '@/lib/recaptcha';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role: z.enum(['BUYER', 'SELLER']),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema);
  if (parsed instanceof Response) return parsed;
  const { email, password, name, role, recaptchaToken } = parsed;

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) return fail('Captcha failed', 400);

  const normEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing && existing.emailVerifiedAt) {
    return fail('An account with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { hashedPassword, name },
      })
    : await prisma.user.create({
        data: { email: normEmail, hashedPassword, name },
      });

  // Ensure role exists (REQ-11 supports multiple roles per user)
  await prisma.role.upsert({
    where: { userId_role: { userId: user.id, role } },
    update: {},
    create: { userId: user.id, role },
  });

  // REQ-10: seller goes into PENDING approval
  if (role === 'SELLER') {
    await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, status: 'PENDING' },
    });
  }

  const code = await issueOtp(normEmail, 'REGISTER', user.id);
  const { subject, html, text } = otpEmail(code);
  await sendEmail({ to: normEmail, subject, html, text });

  return ok({ email: normEmail, role });
}
