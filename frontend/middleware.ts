import { withAuth } from "next-auth/middleware";

/**
 * Edge guard for the authenticated route groups. Unauthenticated requests to
 * /admin, /seller, or /buyer are redirected to /login (with a callbackUrl).
 *
 * This is the missing piece behind the "logged out but still on the page"
 * glitch: once the session cookie is gone, navigating to a protected route now
 * bounces to login instead of rendering a half-authenticated shell. Per-role
 * authorization still happens server-side in each layout (requireAdmin /
 * getSellerSessionWithStatus); this just enforces "must be signed in".
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/buyer/:path*"],
};
