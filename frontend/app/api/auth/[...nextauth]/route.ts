import axios from "axios";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const MAX_SESSION_AGE = 30 * 24 * 60 * 60; // 30 days
const INACTIVE_TIMEOUT = 7 * 24 * 60 * 60; // 7 days

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials: any) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/loginUser`,
            {
              email: credentials.email,
              password: credentials.password,
            },
          );

          const user = response.data.user;

          if (!user) return null;

          return user;
        } catch (err: any) {
          throw new Error(err.response?.data?.error || "Login failed");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000);

      // Initial login
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        // Fixed login time
        token.loginTime = now;
        // Last activity time
        token.lastActive = now;
      }

      // User activity update from frontend
      if (trigger === "update" && session?.activity) {
        token.lastActive = now;
      }

      // Force logout after 30 days
      const totalAge = now - (token.loginTime as number);

      if (totalAge > MAX_SESSION_AGE) {
        return {};
      }

      // Logout after 7 days inactivity
      const inactiveAge = now - (token.lastActive as number);

      if (inactiveAge > INACTIVE_TIMEOUT) {
        return {};
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.id) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session as any).loginTime = token.loginTime;
        (session as any).lastActive = token.lastActive;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: MAX_SESSION_AGE,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: MAX_SESSION_AGE,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
