// Simple in-memory rate limiter: 60 requests per 60-second window per IP.
// Resets the window on first request; does not use a sliding window.
// Note: in-memory state is per-process — on multi-instance deployments
// each instance has an independent counter, which is acceptable for abuse
// prevention on a low-traffic app.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune expired entries periodically to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, WINDOW_MS);

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * Returns a 429 Response if the IP has exceeded the rate limit, otherwise null.
 * Usage: const limited = rateLimit(request); if (limited) return limited;
 */
export function rateLimit(request: Request): Response | null {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(MAX_REQUESTS),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
      },
    });
  }

  return null;
}
