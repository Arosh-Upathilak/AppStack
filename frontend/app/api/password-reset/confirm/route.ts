import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { parseJson, ok, fail } from '@/lib/http';
import { consumeResetToken } from '@/lib/passwordReset';

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema);
  if (parsed instanceof Response) return parsed;

  const userId = await consumeResetToken(parsed.token);
  if (!userId) return fail('Reset link is invalid or expired.', 400);

  const hashedPassword = await bcrypt.hash(parsed.password, 10);
  await prisma.user.update({ where: { id: userId }, data: { hashedPassword } });
  return ok();
}
