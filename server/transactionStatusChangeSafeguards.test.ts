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
const input = { reference: "DCR-2026-STATUS", nextStatus: "manual_review" as const };

describe("DreamCarz lifecycle-status change safeguards", () => {
  it("rejects restricted status notes before any private transaction status record is accessed", async () => {
    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ ...input, note: "Driver license number: D12345678" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("throttles lifecycle-status changes before any private transaction status record is accessed", async () => {
    mockedConsumeRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0, retryAfterMs: 60_000 });

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(adminContext.req, "transaction_lifecycle_status_change", "12");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
