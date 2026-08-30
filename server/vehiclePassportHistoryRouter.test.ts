import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const terminalWithLimit = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });
const historyTerminal = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) })) });
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };

describe("DreamCarz Vehicle Passport operational history", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("allows an administrator to read a selected passport's operational history without file keys", async () => {
    const passport = { id: 91, vehicleId: "2024-chevrolet-malibu-gray", vehicleName: "2024 Chevrolet Malibu", readinessStatus: "inspection_due", currentOdometer: 28501, fuelOrChargeLevel: "Full", updatedAt: new Date("2026-09-02T10:00:00Z") };
    const inspections = [{ id: 1, stage: "post_rental", status: "reviewed", odometerReading: 28501, fuelOrChargeLevel: "Full", tireCondition: null, cleanliness: null, damageNotes: null, hasEvidence: true, inspectedAt: new Date("2026-09-02T09:00:00Z"), reviewedAt: new Date("2026-09-02T10:00:00Z"), createdAt: new Date("2026-09-02T09:00:00Z") }];
    const maintenance = [{ id: 2, maintenanceType: "repair", status: "scheduled", dueAt: null, completedAt: null, odometerAtService: null, vendorName: "Approved vendor", workOrderReference: "WO-123", notes: "Review tire condition", hasInvoiceDocument: true, createdAt: new Date("2026-09-02T10:00:00Z"), updatedAt: new Date("2026-09-02T10:00:00Z") }];
    const select = vi.fn().mockReturnValueOnce(terminalWithLimit([passport])).mockReturnValueOnce(historyTerminal(inspections)).mockReturnValueOnce(historyTerminal(maintenance));
    mockedGetDb.mockResolvedValue({ select } as never);

    const result = await appRouter.createCaller(adminContext as never).operations.vehiclePassports.operationalHistory({ vehiclePassportId: 91 });

    expect(result).toMatchObject({ passport: { vehicleId: "2024-chevrolet-malibu-gray", readinessStatus: "inspection_due" }, inspections: [{ hasEvidence: true }], maintenance: [{ hasInvoiceDocument: true }] });
    const inspectionSelection = select.mock.calls[1]?.[0] as Record<string, unknown>;
    const maintenanceSelection = select.mock.calls[2]?.[0] as Record<string, unknown>;
    expect(inspectionSelection).not.toHaveProperty("photoKeys");
    expect(maintenanceSelection).not.toHaveProperty("invoiceDocumentKey");
  });

  it("rejects a customer before any Vehicle Passport history query", async () => {
    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.operations.vehiclePassports.operationalHistory({ vehiclePassportId: 91 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("returns document-presence indicators to administrators without exposing Vehicle Passport storage keys", async () => {
    const listRows = [{ id: 91, vehicleId: "2024-chevrolet-malibu-gray", vehicleName: "2024 Chevrolet Malibu", readinessStatus: "available", registrationDocumentKey: "private/registration.pdf", insuranceDocumentKey: null, updatedAt: new Date("2026-09-02T10:00:00Z") }];
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(listRows) })) })) } as never);

    const result = await appRouter.createCaller(adminContext as never).operations.vehiclePassports.list();

    expect(result).toEqual([expect.objectContaining({ id: 91, hasRegistrationDocument: true, hasInsuranceDocument: false })]);
    expect(result[0]).not.toHaveProperty("registrationDocumentKey");
    expect(result[0]).not.toHaveProperty("insuranceDocumentKey");
  });

  it("requires a reviewer note before an administrator marks an inspection as needing attention", async () => {
    const caller = appRouter.createCaller(adminContext as never);
    await expect(caller.operations.vehiclePassports.reviewInspection({ inspectionId: 12, status: "needs_attention" })).rejects.toThrow("Add a review note");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("records a human inspection review without changing vehicle readiness", async () => {
    const reviewValues = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn(() => terminalWithLimit([{ id: 12 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: reviewValues })) })),
    };
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(adminContext as never).operations.vehiclePassports.reviewInspection({ inspectionId: 12, status: "needs_attention", reviewNote: "Tire condition requires operations follow-up." })).resolves.toEqual({ success: true, status: "needs_attention", vehicleReadinessChanged: false });
    expect(db.update).toHaveBeenCalled();
  });

  it("requires a staff-recorded completion date and never changes vehicle readiness when maintenance is completed", async () => {
    const caller = appRouter.createCaller(adminContext as never);
    await expect(caller.operations.vehiclePassports.updateMaintenanceStatus({ maintenanceId: 5, status: "completed" })).rejects.toThrow("staff-recorded completion date");
    expect(mockedGetDb).not.toHaveBeenCalled();

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn(() => terminalWithLimit([{ id: 5 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
    };
    mockedGetDb.mockResolvedValue(db as never);
    const completedAt = new Date("2026-09-03T15:30:00Z");

    await expect(caller.operations.vehiclePassports.updateMaintenanceStatus({ maintenanceId: 5, status: "completed", completedAt })).resolves.toEqual({ success: true, status: "completed", vehicleReadinessChanged: false });
    expect(db.update).toHaveBeenCalled();
    expect(updateWhere).toHaveBeenCalled();
  });
});
