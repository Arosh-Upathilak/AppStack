import { createHash, randomBytes } from 'node:crypto';
import { prisma } from './db';

const TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

export async function issueResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.passwordReset.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  return token;
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const row = await prisma.passwordReset.findFirst({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return null;
  await prisma.passwordReset.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return row.userId;
}
