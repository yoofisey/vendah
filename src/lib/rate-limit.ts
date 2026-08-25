type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

export const RATE_LIMITS = {
  checkout: { windowMs: 60_000, max: 5 },
  auth: { windowMs: 900_000, max: 10 },
  passwordReset: { windowMs: 900_000, max: 3 },
  api: { windowMs: 60_000, max: 60 },
} as const;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, retryAfterMs: 0 };
  }

  entry.count += 1;
  if (entry.count > config.max) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    retryAfterMs: 0,
  };
}

export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-RetryAfter": String(retryAfterSec),
      },
    }
  );
}
