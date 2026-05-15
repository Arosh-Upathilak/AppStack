import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      emailVerified: boolean;
      sellerStatus?: string;
    } & DefaultSession['user'];
  }
}

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(input) {
        const parsed = credSchema.safeParse(input);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { roles: true, sellerProfile: true },
        });
        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          // pass-through to jwt callback
          roles: user.roles.map(r => r.role),
          emailVerified: !!user.emailVerifiedAt,
          sellerStatus: user.sellerProfile?.status,
        } as unknown as {
          id: string;
          email: string;
          name?: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          roles: string[];
          emailVerified: boolean;
          sellerStatus?: string;
        };
        token.id = u.id;
        token.roles = u.roles ?? [];
        token.emailVerified = u.emailVerified ?? false;
        token.sellerStatus = u.sellerStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.emailVerified = (token.emailVerified as boolean) ?? false;
        session.user.sellerStatus = token.sellerStatus as string | undefined;
      }
      return session;
    },
  },
});

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export function hasRole(session: { user?: { roles?: string[] } } | null, role: Role) {
  return !!session?.user?.roles?.includes(role);
}
