// Type augmentation for next-auth so session.user has our app-specific shape.
// Picked up automatically by tsconfig "include": ["**/*.ts"].
import "next-auth";
import "next-auth/jwt";

export type AppRole = "BUYER" | "SELLER" | "ADMIN";
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: AppRole[];
      sellerStatus?: SellerStatus | null;
    };
    loginTime?: number;
    lastActive?: number;
  }

  interface User {
    id: string;
    email: string;
    role: AppRole[];
    sellerStatus?: SellerStatus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole[];
    sellerStatus?: SellerStatus | null;
    loginTime?: number;
    lastActive?: number;
  }
}
