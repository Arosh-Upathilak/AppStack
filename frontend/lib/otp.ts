import { createHash, randomInt } from 'node:crypto';
import { prisma } from './db';

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;

type Purpose = 'REGISTER' | 'SUBSCRIBE_ALT_EMAIL' | 'LOGIN';

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function issueOtp(email: string, purpose: Purpose, userId?: string) {
  const recent = await prisma.otp.findFirst({
    where: { email, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new Error('Please wait a moment before requesting another code.');
  }

  const code = generateCode();
  await prisma.otp.create({
    data: {
      email,
      userId,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(email: string, code: string, purpose: Purpose): Promise<boolean> {
  const codeHash = hashCode(code);
  const otp = await prisma.otp.findFirst({
    where: { email, purpose, codeHash, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return false;
  await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return true;
}
