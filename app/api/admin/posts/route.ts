import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from '@/lib/auth';
import { logSecurityEvent, logServerError } from '@/lib/logger';
import { getAdminPosts } from '@/lib/posts';
import { getClientIp } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const responseHeaders = new Headers({
    'Cache-Control': 'no-store',
    Vary: 'Cookie',
  });
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSessionToken(sessionToken)) {
    logSecurityEvent('admin_posts_unauthorized', {
      ip: getClientIp(request),
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: responseHeaders }
    );
  }

  try {
    const posts = await getAdminPosts();
    return NextResponse.json({ ok: true, posts }, { headers: responseHeaders });
  } catch (error) {
    logServerError('admin_posts_load_failed', error, {
      ip: getClientIp(request),
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      { ok: false, error: 'Failed to load posts.' },
      { status: 500, headers: responseHeaders }
    );
  }
}
