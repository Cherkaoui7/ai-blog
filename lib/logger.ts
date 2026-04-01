type LogDetails = Record<string, unknown>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return { message: String(error) };
}

export function logSecurityEvent(event: string, details: LogDetails = {}) {
  console.warn('[security]', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export function logServerError(event: string, error: unknown, details: LogDetails = {}) {
  console.error('[server-error]', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
    error: normalizeError(error),
  });
}
