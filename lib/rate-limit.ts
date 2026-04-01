type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const STORE_KEY = '__ai_blog_rate_limit_store__';
const MAX_ENTRIES = 5_000;

type GlobalWithRateLimitStore = typeof globalThis & {
  [STORE_KEY]?: Map<string, RateLimitEntry>;
};

function getStore() {
  const globalScope = globalThis as GlobalWithRateLimitStore;

  if (!globalScope[STORE_KEY]) {
    globalScope[STORE_KEY] = new Map<string, RateLimitEntry>();
  }

  return globalScope[STORE_KEY];
}

function pruneExpiredEntries(now: number) {
  const store = getStore();

  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_ENTRIES) {
    return;
  }

  const entriesByReset = [...store.entries()].sort((left, right) => left[1].resetAt - right[1].resetAt);

  for (const [key] of entriesByReset.slice(0, store.size - MAX_ENTRIES)) {
    store.delete(key);
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: RateLimitOptions): RateLimitResult {
  pruneExpiredEntries(now);

  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });

    return {
      limited: false,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);

  const limited = current.count > limit;

  return {
    limited,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set('RateLimit-Limit', String(result.limit));
  headers.set('RateLimit-Remaining', String(result.remaining));
  headers.set('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (result.limited) {
    headers.set('Retry-After', String(result.retryAfterSeconds));
  }
}
