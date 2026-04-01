import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'blog_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  role: 'admin';
  exp: number;
};

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error('ADMIN_SECRET is not configured.');
  }

  return secret;
}

function getSessionSecret() {
  return process.env.AUTH_SECRET || getAdminSecret();
}

function createDigest(value: string) {
  return createHash('sha256').update(value).digest();
}

function safeCompare(left: string, right: string) {
  return timingSafeEqual(createDigest(left), createDigest(right));
}

function signPayload(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function encodePayload(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}

function decodePayload(value: string) {
  const decoded = Buffer.from(value, 'base64url').toString('utf-8');
  return JSON.parse(decoded) as Partial<AdminSessionPayload>;
}

export function isValidAdminPassword(password: string) {
  return safeCompare(password, getAdminSecret());
}

export function createAdminSessionToken(now = Date.now()) {
  const payload = encodePayload({
    role: 'admin',
    exp: Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS,
  });

  return `${payload}.${signPayload(payload)}`;
}

export function isValidAdminSessionToken(token: string | null | undefined, now = Date.now()) {
  if (!token) {
    return false;
  }

  const [payload, signature, ...rest] = token.split('.');

  if (!payload || !signature || rest.length > 0) {
    return false;
  }

  try {
    if (!safeCompare(signature, signPayload(payload))) {
      return false;
    }

    const parsed = decodePayload(payload);

    return (
      parsed.role === 'admin' &&
      typeof parsed.exp === 'number' &&
      parsed.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: '/',
    priority: 'high' as const,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}
