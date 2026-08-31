import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.30" }, res: {} };

describe("DreamCarz handoff note privacy", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("rejects likely sensitive content before a handoff note accesses records", async () => {
    await expect(appRouter.createCaller(adminContext as never).operations.handoff.update({ reference: "DCR-2026-HANDOFF", handoffStatus: "scheduled", handoffNotes: "Password: prohibited-value" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
