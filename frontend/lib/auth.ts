import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from './db';

const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

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
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 60 * 60 },
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      const existingRoles = await prisma.role.count({ where: { userId: user.id! } });
      if (existingRoles > 0) {
        // Returning Google user — ensure emailVerifiedAt is stamped
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { emailVerifiedAt: true },
        });
        if (!dbUser?.emailVerifiedAt) {
          await prisma.user.update({ where: { id: user.id! }, data: { emailVerifiedAt: new Date() } });
        }
        return true;
      }

      // New Google user — read role choice from cookie set before OAuth redirect
      const cookieStore = await cookies();
      const roleCookie = cookieStore.get('as_oauth_role');
      const chosenRole: 'BUYER' | 'SELLER' =
        roleCookie?.value === 'SELLER' ? 'SELLER' : 'BUYER';

      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (googleProfile?.email_verified !== false) {
        await prisma.user.update({ where: { id: user.id! }, data: { emailVerifiedAt: new Date() } });
      }

      await prisma.role.create({ data: { userId: user.id!, role: chosenRole } });

      if (chosenRole === 'SELLER') {
        await prisma.sellerProfile.create({ data: { userId: user.id!, status: 'PENDING' } });
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Idle timeout: invalidate session after 7 days of inactivity
      if (token.lastActivityAt && typeof token.lastActivityAt === 'number') {
        if (Date.now() - (token.lastActivityAt as number) > IDLE_TIMEOUT_MS) {
          return {};
        }
      }

      if (user) {
        if (account?.provider === 'google') {
          // Re-fetch roles for Google path — not passed through authorize()
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id! },
            include: { roles: true, sellerProfile: true },
          });
          token.id = user.id;
          token.roles = dbUser?.roles.map(r => r.role) ?? [];
          token.emailVerified = !!dbUser?.emailVerifiedAt;
          token.sellerStatus = dbUser?.sellerProfile?.status;
        } else {
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
      }

      token.lastActivityAt = Date.now();
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.roles = (token.roles as string[]) ?? [];
        (session.user as { emailVerified: boolean }).emailVerified = (token.emailVerified as boolean) ?? false;
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
