type HeaderStore = Pick<Headers, 'get'>;
type RequestLike = HeaderStore | { headers: HeaderStore };

function getHeader(source: RequestLike, key: string) {
  return 'headers' in source ? source.headers.get(key) : source.get(key);
}

export function getClientIp(source: RequestLike): string {
  const forwardedFor = getHeader(source, 'x-forwarded-for');
  const realIp = getHeader(source, 'x-real-ip');
  const cfIp = getHeader(source, 'cf-connecting-ip');

  return (
    forwardedFor?.split(',')[0]?.trim() ||
    realIp?.trim() ||
    cfIp?.trim() ||
    'unknown'
  );
}

export function getSafeRedirectPath(value: string | null | undefined, fallback = '/pipeline') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}
