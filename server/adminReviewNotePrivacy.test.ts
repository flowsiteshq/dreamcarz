import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.21" }, res: {} };

describe("DreamCarz administrator review note privacy", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("rejects likely sensitive content before administrator review notes access records", async () => {
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.rentalExtensions.review({ requestId: 22, decision: "declined", reviewNote: "Card number 4111 1111 1111 1111" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.operations.settlements.reviewAdjustment({ adjustmentId: 23, status: "waived", reviewNote: "Password: prohibited-value" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.operations.reviewApplication({ id: 24, status: "needs_attention", reviewNote: "Driver license number: A1234567" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.operations.reviewReservation({ id: 25, status: "under_review", reviewNote: "PIN: 1234" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
