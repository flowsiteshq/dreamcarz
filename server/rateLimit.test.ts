import { afterEach, describe, expect, it } from "vitest";
import { consumeRateLimit, rateLimitKey, resetRateLimitsForTests } from "./rateLimit";

describe("DreamCarz rate limiting", () => {
  afterEach(() => resetRateLimitsForTests());

  it("limits repeated attempts within the configured window and resets after expiry", () => {
    const key = "login:127.0.0.1:member@example.com";
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1_000, now: 10 }).allowed).toBe(true);
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1_000, now: 11 }).allowed).toBe(true);
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1_000, now: 12 })).toMatchObject({ allowed: false, remaining: 0 });
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1_000, now: 1_011 }).allowed).toBe(true);
  });

  it("uses a normalized forwarded client address and email subject", () => {
    expect(rateLimitKey({ headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" } }, "login", "MEMBER@EXAMPLE.COM"))
      .toBe("login:203.0.113.10:member@example.com");
  });
});
