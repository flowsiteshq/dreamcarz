import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: false, remaining: 0, retryAfterMs: 60_000 })),
  rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`),
}));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { rateLimitKey } from "./rateLimit";

const mockedGetDb = vi.mocked(getDb);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const staffContext = { user: { id: 8, name: "Support", email: "support@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.11" }, res: {} };

describe("DreamCarz support operation rate limits", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedRateLimitKey.mockClear();
  });

  it("throttles staff support updates before assignment or support-request lookup", async () => {
    await expect(appRouter.createCaller(staffContext as never).supportRequests.review({ supportRequestId: 44, status: "under_review", internalNote: "Reviewing the request." })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockedRateLimitKey).toHaveBeenCalledWith(staffContext.req, "support_request_review", "8");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
