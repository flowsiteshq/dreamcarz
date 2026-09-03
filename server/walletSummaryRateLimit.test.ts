import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const memberContext = {
  user: { id: 86, name: "Wallet Member", email: "wallet@example.test", role: "user" },
  req: { headers: {} },
  res: {},
};

describe("wallet summary rate limit", () => {
  beforeEach(() => { mockedGetDb.mockReset(); resetRateLimitsForTests(); });

  it("limits account-owned wallet reads before another database lookup", async () => {
    mockedGetDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(memberContext as never);

    for (let attempt = 0; attempt < 120; attempt += 1) {
      await expect(caller.wallet.mine()).rejects.toThrow("Wallet records are temporarily unavailable");
    }

    const dbCallsBeforeBlockedAttempt = mockedGetDb.mock.calls.length;
    await expect(caller.wallet.mine()).rejects.toThrow("Too many wallet-summary requests");
    expect(mockedGetDb).toHaveBeenCalledTimes(dbCallsBeforeBlockedAttempt);
  });
});
