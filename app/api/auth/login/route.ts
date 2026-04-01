import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isValidAdminPassword,
} from '@/lib/auth';
import { logSecurityEvent, logServerError } from '@/lib/logger';
import { getClientIp } from '@/lib/request';
import { applyRateLimitHeaders, checkRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const responseHeaders = new Headers({
    'Cache-Control': 'no-store',
    Vary: 'Cookie',
  });
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit({
    key: `auth:login:${clientIp}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  applyRateLimitHeaders(responseHeaders, rateLimit);

  if (rateLimit.limited) {
    logSecurityEvent('login_rate_limited', { ip: clientIp });

    return NextResponse.json(
      { ok: false, error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: responseHeaders }
    );
  }

  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json(
      { ok: false, error: 'Unsupported content type.' },
      { status: 415, headers: responseHeaders }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body.' },
      { status: 400, headers: responseHeaders }
    );
  }

  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid credentials.' },
      { status: 400, headers: responseHeaders }
    );
  }

  try {
    if (!isValidAdminPassword(parsedBody.data.password)) {
      logSecurityEvent('login_failed', { ip: clientIp });

      return NextResponse.json(
        { ok: false, error: 'Invalid credentials.' },
        { status: 401, headers: responseHeaders }
      );
    }
  } catch (error) {
    logServerError('login_configuration_error', error, { ip: clientIp });

    return NextResponse.json(
      { ok: false, error: 'Authentication is temporarily unavailable.' },
      { status: 500, headers: responseHeaders }
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: responseHeaders });
  res.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), getAdminSessionCookieOptions());
  return res;
}
