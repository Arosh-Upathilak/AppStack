import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BYPASS = process.env.AUTH_BYPASS === '1';
const SECRET = process.env.AUTH_SECRET;

function requiredRoleFor(pathname: string): 'BUYER' | 'SELLER' | 'ADMIN' | null {
  if (pathname.startsWith('/buyer')) return 'BUYER';
  if (pathname.startsWith('/seller')) return 'SELLER';
  if (pathname.startsWith('/admin')) return 'ADMIN';
  return null;
}

export async function middleware(req: NextRequest) {
  if (BYPASS) return NextResponse.next();
  const required = requiredRoleFor(req.nextUrl.pathname);
  if (!required) return NextResponse.next();

  const token = await getToken({ req, secret: SECRET });
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  const roles = (token.roles as string[]) ?? [];
  if (!roles.includes(required)) {
    const url = new URL('/', req.url);
    url.searchParams.set('forbidden', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/buyer/:path*', '/seller/:path*', '/admin/:path*'],
};
