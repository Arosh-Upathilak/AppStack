import axios from "axios";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { retryOnTransient } from "@/lib/retry";
import { getRecaptchaToken } from "@/lib/recaptcha";

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
        token: { label: "reCAPTCHA token", type: "text" },
      },

      async authorize(credentials: any) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const response = await retryOnTransient(() =>
            axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/loginUser`,
              {
                email: credentials.email,
                password: credentials.password,
                token: credentials.token,
              },
            ),
          );

          const user = response.data.user;
          const accessToken = response.data.accessToken;

          if (!user) return null;

          return {
            ...user,
            accessToken,
          };
        } catch (err: any) {
          throw new Error(err.response?.data?.error || "Login failed");
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.NEXT_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.NEXT_GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      try {

        const res = await retryOnTransient(() =>
          axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google-login`,
            {
              email: user.email,
              name: user.name,
              image: user.image,
              providerAccountId: account.providerAccountId,
            },
          ),
        );
        const backendUser = res.data?.user;
        const backendAccessToken = res.data?.accessToken;
        if (backendUser) {
          (user as any).id = backendUser.id;
          (user as any).role = backendUser.role;
          (user as any).sellerStatus = backendUser.sellerStatus ?? null;
          (user as any).accessToken = backendAccessToken;
        }
      } catch (err) {
        console.warn(
          "[next-auth] /auth/google-login not available — using BUYER stub",
          (err as any)?.message,
        );
        console.error("Google login failed")
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000);

      // Initial login
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.sellerStatus = (user as any).sellerStatus ?? null;
        token.accessToken = (user as any).accessToken;
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
        (session.user as any).sellerStatus = token.sellerStatus ?? null;
        (session as any).accessToken = token.accessToken;
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
