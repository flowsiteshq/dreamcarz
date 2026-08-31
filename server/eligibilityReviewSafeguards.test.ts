import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, retryAfterMs: 0 })),
  rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`),
}));

import { getDb } from "./db";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedConsumeRateLimit = vi.mocked(consumeRateLimit);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const adminContext = { user: { id: 12, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };
const input = { reference: "DCR-2026-ELIG", status: "manual_review" as const, decisionReason: "Manual review is required." };

describe("DreamCarz eligibility review safeguards", () => {
  it("rejects restricted content before eligibility, transaction, or policy records are accessed", async () => {
    await expect(appRouter.createCaller(adminContext as never).operations.reviewEligibility({ ...input, decisionReason: "Card number 4111 1111 1111 1111" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("throttles administrator review attempts before any eligibility, transaction, or policy record access", async () => {
    mockedConsumeRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0, retryAfterMs: 60_000 });

    await expect(appRouter.createCaller(adminContext as never).operations.reviewEligibility(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(adminContext.req, "eligibility_review", "12");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
