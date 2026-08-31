import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 12, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

describe("DreamCarz transaction quote SKU governance", () => {
  it("rejects a quote without an exact CoCard product SKU before any transaction or financial record lookup", async () => {
    await expect(appRouter.createCaller(adminContext as never).operations.createTransactionQuote({
      reference: "DCR-2026-QUOTE",
      lines: [{ lineType: "base_rental", label: "Reviewed vehicle access", amountCents: 10000, isConditional: false }],
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
