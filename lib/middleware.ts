import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/pipeline' || pathname === '/admin') {
    const auth = req.cookies.get('blog_auth')?.value;
    if (auth !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pipeline', '/admin'],
};