import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const terminal = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });

function extensionReviewDb(preference: unknown[]) {
  const request = { id: 811, transactionId: 455, status: "pending" as const, requestedEndDate: "2026-10-04" };
  const transaction = { id: 455, userId: 77, reference: "DCR-2026-LIFECYCLE", transactionType: "rental" as const, status: "active_rental" as const };
  const schedule = { id: 93, requestedEndAt: new Date("2026-10-02T12:00:00.000Z") };
  const select = vi.fn().mockReturnValueOnce(terminal([request])).mockReturnValueOnce(terminal([transaction])).mockReturnValueOnce(terminal([schedule])).mockReturnValueOnce(terminal(preference));
  const insertValues = vi.fn().mockResolvedValue([{ insertId: 501 }]);
  return { select, update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })), insert: vi.fn(() => ({ values: insertValues })), insertValues };
}

describe("DreamCarz automatic lifecycle notices", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("delivers a private in-app extension decision notice when the member has not opted out", async () => {
    const db = extensionReviewDb([]);
    mockedGetDb.mockResolvedValue(db as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.rentalExtensions.review({ requestId: 811, decision: "approved", reviewNote: "Schedule and operating requirements were reviewed." })).resolves.toMatchObject({ success: true, status: "approved" });
    const inserts = db.insertValues.mock.calls.map(([value]) => value);
    expect(inserts).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: 77, category: "transaction", title: "Rental extension reviewed", relatedTransactionId: 455 }),
      expect.objectContaining({ userId: 77, channel: "in_app", status: "delivered", detail: "Automated lifecycle notice" }),
    ]));
  });

  it("suppresses a private in-app extension decision notice when the member opted out", async () => {
    const db = extensionReviewDb([{ transactionalInAppEnabled: false }]);
    mockedGetDb.mockResolvedValue(db as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.rentalExtensions.review({ requestId: 811, decision: "declined", reviewNote: "The current schedule must remain unchanged." })).resolves.toMatchObject({ success: true, status: "declined" });
    const inserts = db.insertValues.mock.calls.map(([value]) => value);
    expect(inserts).not.toEqual(expect.arrayContaining([expect.objectContaining({ title: "Rental extension reviewed" })]));
    expect(inserts).toEqual(expect.arrayContaining([expect.objectContaining({ userId: 77, channel: "in_app", status: "suppressed" })]));
  });
});
