import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/logger';
import { getClientIp, getSafeRedirectPath } from '@/lib/request';

function buildUnauthorizedApiResponse() {
  const response = NextResponse.json(
    { ok: false, error: 'Unauthorized' },
    {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
        Vary: 'Cookie',
      },
    }
  );

  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', getSafeRedirectPath(request.nextUrl.pathname, '/pipeline'));

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/pipeline') ||
    pathname.startsWith('/api/admin');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (isValidAdminSessionToken(sessionToken)) {
    return NextResponse.next();
  }

  logSecurityEvent('unauthorized_request', {
    ip: getClientIp(request),
    method: request.method,
    path: pathname,
  });

  if (pathname.startsWith('/api/admin')) {
    return buildUnauthorizedApiResponse();
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: ['/admin/:path*', '/pipeline/:path*', '/api/admin/:path*'],
};
