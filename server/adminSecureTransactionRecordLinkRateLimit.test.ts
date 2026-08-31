import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: false, remaining: 0, retryAfterMs: 60_000 })),
  rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`),
}));

import { getDb } from "./db";
import { rateLimitKey } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const adminContext = { user: { id: 12, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

describe("DreamCarz administrator secure transaction record links", () => {
  it("throttles signed-link requests before any private transaction lookup, access audit, or storage operation", async () => {
    await expect(appRouter.createCaller(adminContext as never).operations.getTransactionRecordLink({ transactionId: 31, source: "agreement", recordId: 48 })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(adminContext.req, "admin_secure_transaction_record_link", "12");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
