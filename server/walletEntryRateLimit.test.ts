import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const administratorContext = {
  user: { id: 92, name: "Wallet Administrator", email: "wallet-admin@example.test", role: "admin" },
  req: { headers: {} },
  res: {},
};

describe("wallet ledger-entry rate limit", () => {
  beforeEach(() => { mockedGetDb.mockReset(); resetRateLimitsForTests(); });

  it("limits administrator ledger-entry attempts before another database lookup", async () => {
    mockedGetDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(administratorContext as never);
    const input = { userId: 5, entryType: "adjustment" as const, amountCents: 100, description: "Verified manual ledger correction", status: "pending" as const };

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await expect(caller.wallet.recordEntry(input)).rejects.toThrow("Wallet records are temporarily unavailable");
    }

    const dbCallsBeforeBlockedAttempt = mockedGetDb.mock.calls.length;
    await expect(caller.wallet.recordEntry(input)).rejects.toThrow("Too many wallet-ledger entry requests");
    expect(mockedGetDb).toHaveBeenCalledTimes(dbCallsBeforeBlockedAttempt);
  });
});
