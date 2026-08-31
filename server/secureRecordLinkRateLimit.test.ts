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
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

describe("DreamCarz secure private-document links", () => {
  it("throttles signed-link requests before a private record lookup, audit write, or storage operation", async () => {
    await expect(appRouter.createCaller(memberContext as never).transactions.getRecordLink({ recordType: "transaction_license_document", id: 91 })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "secure_record_link", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
