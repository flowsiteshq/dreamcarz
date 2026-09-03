import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const associateContext = {
  user: { id: 67, name: "Associate", email: "associate@example.test", role: "admin" },
  req: { headers: {} },
  res: {},
};

describe("associate.overview rate limit", () => {
  beforeEach(() => { mockedGetDb.mockReset(); resetRateLimitsForTests(); });

  it("limits private Associate overview reads before another database lookup", async () => {
    mockedGetDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(associateContext as never);

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await expect(caller.associate.overview()).rejects.toThrow("Associate data is temporarily unavailable");
    }

    const dbCallsBeforeBlockedAttempt = mockedGetDb.mock.calls.length;
    await expect(caller.associate.overview()).rejects.toThrow("Too many Associate overview requests");
    expect(mockedGetDb).toHaveBeenCalledTimes(dbCallsBeforeBlockedAttempt);
  });
});
