type RateLimitRecord = { count: number; resetAt: number };

const attempts = new Map<string, RateLimitRecord>();

export function rateLimitKey(request: { headers?: Record<string, string | string[] | undefined>; ip?: string | undefined }, scope: string, subject: string) {
  const forwarded = request.headers?.["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `${scope}:${address || request.ip || "unknown"}:${subject.toLowerCase()}`;
}

export function consumeRateLimit(input: { key: string; limit: number; windowMs: number; now?: number }) {
  const now = input.now ?? Date.now();
  const existing = attempts.get(input.key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, remaining: input.limit - 1, retryAfterMs: 0 };
  }
  if (existing.count >= input.limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }
  existing.count += 1;
  attempts.set(input.key, existing);
  return { allowed: true, remaining: input.limit - existing.count, retryAfterMs: 0 };
}

export function resetRateLimitsForTests() {
  attempts.clear();
}
