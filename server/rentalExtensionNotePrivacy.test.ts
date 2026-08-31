import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: true, remaining: 3, retryAfterMs: 0 })),
  rateLimitKey: vi.fn(() => "rental-extension-request"),
}));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const customerContext = { user: { id: 51, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "198.51.100.51" }, res: {} };

describe("DreamCarz rental extension note privacy", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("rejects likely sensitive content before an extension note accesses the transaction", async () => {
    await expect(appRouter.createCaller(customerContext as never).transactions.requestRentalExtension({ reference: "DCR-2026-EXTEND", requestedEndDate: "2026-10-20", note: "Card number 4111 1111 1111 1111" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
