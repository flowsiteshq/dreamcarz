import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const associateContext = {
  user: { id: 81, name: "Associate", email: "associate@example.test", role: "admin" },
  req: { headers: {} },
  res: {},
};

describe("associate lead action rate limit", () => {
  beforeEach(() => { mockedGetDb.mockReset(); resetRateLimitsForTests(); });

  it("limits combined create and status-change requests before another database lookup", async () => {
    mockedGetDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(associateContext as never);
    const leadInput = { contactName: "Consented Contact", contactEmail: "contact@example.test", interestType: "general" as const, consentToContact: true as const };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await expect(caller.associate.createLead(leadInput)).rejects.toThrow("Lead capture is temporarily unavailable");
    }

    const dbCallsBeforeBlockedAttempt = mockedGetDb.mock.calls.length;
    await expect(caller.associate.updateLead({ id: 1, status: "contacted" })).rejects.toThrow("Too many Associate lead actions");
    expect(mockedGetDb).toHaveBeenCalledTimes(dbCallsBeforeBlockedAttempt);
  });
});
