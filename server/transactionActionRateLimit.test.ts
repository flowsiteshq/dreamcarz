import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: false, remaining: 0, retryAfterMs: 60000 })),
  rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`),
}));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";

const mockedGetDb = vi.mocked(getDb);
const mockedConsumeRateLimit = vi.mocked(consumeRateLimit);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

describe("DreamCarz sensitive transaction action rate limits", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedConsumeRateLimit.mockClear();
    mockedRateLimitKey.mockClear();
  });

  it("throttles rental extension requests before database access", async () => {
    await expect(appRouter.createCaller(memberContext as never).transactions.requestRentalExtension({ reference: "DCR-2026-RATE", requestedEndDate: "2026-10-04" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "rental_extension_request", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("throttles linked rent-to-buy and swap requests before database access", async () => {
    await expect(appRouter.createCaller(memberContext as never).operations.requestLinkedTransaction({ reference: "DCR-2026-RATE", linkType: "swap", targetVehicleId: "2024-chevrolet-malibu-gray" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "linked_transaction_request", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("throttles repeated handoff acknowledgements before database access", async () => {
    await expect(appRouter.createCaller(memberContext as never).transactions.confirmHandoff({ reference: "DCR-2026-RATE", acknowledgesHandoff: true })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "transaction_handoff_confirmation", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
