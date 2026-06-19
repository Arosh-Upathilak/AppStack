import axios from "axios";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { retryOnTransient } from "@/lib/retry";
import { getErrorMessage } from "@/lib/api/errors";
import type { AppRole, SellerStatus } from "@/types/next-auth";

const MAX_SESSION_AGE = 30 * 24 * 60 * 60; // 30 days
const INACTIVE_TIMEOUT = 7 * 24 * 60 * 60; // 7 days
const googleClientId = process.env.NEXT_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.NEXT_GOOGLE_CLIENT_SECRET;
const apiBase =
  process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

interface BackendUser {
  id: string;
  email?: string | null;
  role: AppRole[];
  sellerStatus?: SellerStatus | null;
}

interface AuthResponse {
  user?: BackendUser;
  accessToken?: string;
}

interface SessionUpdatePayload {
  activity?: boolean;
  refreshUser?: boolean;
}

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

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const response = await retryOnTransient(() =>
            axios.post<AuthResponse>(
              `${apiBase}/auth/loginUser`,
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
            email: user.email ?? credentials.email,
            accessToken,
          };
        } catch (err) {
          throw new Error(getErrorMessage(err, "Login failed"));
        }
      },
    }),

    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: { prompt: "select_account" },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      try {

        const res = await retryOnTransient(() =>
          axios.post<AuthResponse>(
            `${apiBase}/auth/google-login`,
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
          user.id = backendUser.id;
          user.role = backendUser.role;
          user.sellerStatus = backendUser.sellerStatus ?? null;
          user.accessToken = backendAccessToken;
        }
      } catch (err) {
        console.warn(
          "[next-auth] /auth/google-login not available — using BUYER stub",
          err instanceof Error ? err.message : err,
        );
        console.error("Google login failed");
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000);
      const updatePayload = session as SessionUpdatePayload | undefined;

      // Initial login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sellerStatus = user.sellerStatus ?? null;
        token.accessToken = user.accessToken;
        // Fixed login time
        token.loginTime = now;
        // Last activity time
        token.lastActive = now;
      }

      if (trigger === "update" && updatePayload?.refreshUser && token.accessToken) {
        try {
          const response = await retryOnTransient(() =>
            axios.get<AuthResponse>(`${apiBase}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            }),
          );

          const refreshedUser = response.data.user;

          if (refreshedUser) {
            token.id = refreshedUser.id;
            token.role = refreshedUser.role;
            token.sellerStatus = refreshedUser.sellerStatus ?? null;
            token.accessToken = response.data.accessToken ?? token.accessToken;
            token.lastActive = now;
          }
        } catch (err) {
          console.error("[next-auth] Failed to refresh current user", err);
        }
      }

      // User activity update from frontend
      if (trigger === "update" && updatePayload?.activity) {
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
        session.user.id = token.id;
        session.user.role = token.role ?? [];
        session.user.sellerStatus = token.sellerStatus ?? null;
        session.accessToken = token.accessToken;
        session.loginTime = token.loginTime;
        session.lastActive = token.lastActive;
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
