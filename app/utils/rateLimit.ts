/**
 * Simple in-memory rate limiter for API routes.
 *
 * Limitation: On Vercel serverless, each function instance has its own memory.
 * This provides burst protection within a single instance but does NOT provide
 * global rate limiting across instances. For production-scale global rate
 * limiting, use Redis (e.g., Upstash @upstash/ratelimit).
 */

const store = new Map<string, { count: number; resetTime: number }>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, record] of store) {
    if (now > record.resetTime) store.delete(key);
  }
}

/**
 * Check if a request is allowed under the rate limit.
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  cleanup();

  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get client IP from request headers (works with Vercel/proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
