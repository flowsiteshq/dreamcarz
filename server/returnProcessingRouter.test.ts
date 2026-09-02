import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 2, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const memberContext = { user: { id: 3, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };
const one = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });

describe("DreamCarz returned vehicle processing", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("blocks members before return-processing data is queried", async () => {
    await expect(appRouter.createCaller(memberContext as never).operations.returnProcessing.process({ reference: "DCR-2026-RETURN", readinessStatus: "inspection_due", note: "Human inspection review remains required." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires finalized settlement review before altering a Vehicle Passport readiness state", async () => {
    const select = vi.fn().mockReturnValueOnce(one([{ id: 81, transactionType: "rental", status: "return_pending", conditionStatus: "return_complete", vehicleId: "2024-chevrolet-malibu-gray" }])).mockReturnValueOnce(one([{ status: "under_review" }]));
    const update = vi.fn();
    mockedGetDb.mockResolvedValue({ select, update } as never);

    await expect(appRouter.createCaller(adminContext as never).operations.returnProcessing.process({ reference: "DCR-2026-RETURN", readinessStatus: "inspection_due", note: "Human inspection review remains required." })).rejects.toThrow("Finalize the return settlement review");
    expect(update).not.toHaveBeenCalled();
  });

  it("records a manual readiness decision only after return evidence and settlement review are complete", async () => {
    const transaction = { id: 81, transactionType: "rental", status: "return_pending", conditionStatus: "return_complete", vehicleId: "2024-chevrolet-malibu-gray" };
    const updateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
    const eventValues = vi.fn().mockResolvedValue(undefined);
    const select = vi.fn().mockReturnValueOnce(one([transaction])).mockReturnValueOnce(one([{ status: "settled" }])).mockReturnValueOnce(one([{ id: 5, readinessStatus: "active_rental" }]));
    mockedGetDb.mockResolvedValue({ select, update: vi.fn(() => ({ set: updateSet })), insert: vi.fn(() => ({ values: eventValues })) } as never);

    await expect(appRouter.createCaller(adminContext as never).operations.returnProcessing.process({ reference: "DCR-2026-RETURN", readinessStatus: "maintenance_due", note: "Observed condition needs an operations maintenance follow-up." })).resolves.toMatchObject({ success: true, previousReadiness: "active_rental", readinessStatus: "maintenance_due" });
    expect(updateSet).toHaveBeenCalledWith({ readinessStatus: "maintenance_due" });
    expect(eventValues).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 81, eventType: "return.vehicle_processing_recorded", actorType: "admin" }));
  });

  it("requires a reviewed return condition report before an administrator finalizes a settlement", async () => {
    const transaction = { id: 82, transactionType: "rental" as const, settlementStatus: "pending" as const, userId: 3 };
    const settlement = { id: 17, status: "under_review" as const };
    const select = vi.fn()
      .mockReturnValueOnce(one([transaction]))
      .mockReturnValueOnce(one([settlement]))
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 31, status: "submitted" }]) })) })) })) });
    mockedGetDb.mockResolvedValue({ select } as never);

    await expect(appRouter.createCaller(adminContext as never).operations.settlements.finalize({
      reference: "DCR-2026-SETTLEMENT-GUARD",
      approvedSubtotalCents: 0,
      depositAppliedCents: 0,
      status: "settled",
      summary: "Reviewed return settlement record.",
    })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "A reviewed return condition report is required before a return settlement can be finalized.",
    });
  });
});
