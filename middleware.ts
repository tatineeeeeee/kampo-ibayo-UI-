import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side route protection for admin pages.
 * Checks lightweight auth cookies set by AuthContext.
 *
 * NOTE: This is a UX layer, not the primary security boundary.
 * All API routes independently verify JWT tokens via serverAuth.ts.
 * This prevents unauthenticated users from seeing admin page shells.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.get('kb_authenticated')?.value === 'true';
  const role = request.cookies.get('kb_role')?.value;

  // /admin/* routes: require admin or staff
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || (role !== 'admin' && role !== 'staff')) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // /sms-test: require admin only (not staff)
  if (pathname === '/sms-test') {
    if (!isAuthenticated || role !== 'admin') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/sms-test'],
};
