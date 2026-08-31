import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { storageGetSignedUrl, storagePut } from "./storage";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedStorageGetSignedUrl = vi.mocked(storageGetSignedUrl);
const mockedStoragePut = vi.mocked(storagePut);
const terminalWithLimit = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });
const historyTerminal = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) })) });
const whereTerminal = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(result) })) });
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };

describe("DreamCarz Vehicle Passport operational history", () => {
  beforeEach(() => { mockedGetDb.mockReset(); mockedStorageGetSignedUrl.mockReset(); mockedStoragePut.mockReset(); });
  afterEach(() => resetRateLimitsForTests());

  it("allows an administrator to read a selected passport's operational history without file keys", async () => {
    const passport = { id: 91, vehicleId: "2024-chevrolet-malibu-gray", vehicleName: "2024 Chevrolet Malibu", readinessStatus: "inspection_due", currentOdometer: 28501, fuelOrChargeLevel: "Full", updatedAt: new Date("2026-09-02T10:00:00Z") };
    const inspections = [{ id: 1, stage: "post_rental", status: "reviewed", odometerReading: 28501, fuelOrChargeLevel: "Full", tireCondition: null, cleanliness: null, damageNotes: null, hasEvidence: true, inspectedAt: new Date("2026-09-02T09:00:00Z"), reviewedAt: new Date("2026-09-02T10:00:00Z"), createdAt: new Date("2026-09-02T09:00:00Z") }];
    const maintenance = [{ id: 2, maintenanceType: "repair", status: "scheduled", dueAt: null, completedAt: null, odometerAtService: null, vendorName: "Approved vendor", workOrderReference: "WO-123", notes: "Review tire condition", hasInvoiceDocument: true, createdAt: new Date("2026-09-02T10:00:00Z"), updatedAt: new Date("2026-09-02T10:00:00Z") }];
    const activities = [{ id: 3, eventType: "maintenance.invoice_uploaded", createdAt: new Date("2026-09-02T10:05:00Z") }];
    const select = vi.fn().mockReturnValueOnce(terminalWithLimit([passport])).mockReturnValueOnce(historyTerminal(inspections)).mockReturnValueOnce(historyTerminal(maintenance)).mockReturnValueOnce(historyTerminal(activities)).mockReturnValueOnce(whereTerminal([{ id: 10 }, { id: 11 }])).mockReturnValueOnce(whereTerminal([{ id: 12 }]));
    mockedGetDb.mockResolvedValue({ select } as never);

    const result = await appRouter.createCaller(adminContext as never).operations.vehiclePassports.operationalHistory({ vehiclePassportId: 91 });

    expect(result).toMatchObject({ passport: { vehicleId: "2024-chevrolet-malibu-gray", readinessStatus: "inspection_due" }, inspections: [{ hasEvidence: true }], maintenance: [{ hasInvoiceDocument: true }], activities: [{ eventType: "maintenance.invoice_uploaded" }], operationalCounts: { openReservationCount: 2, activeRentalCount: 1 } });
    const inspectionSelection = select.mock.calls[1]?.[0] as Record<string, unknown>;
    const maintenanceSelection = select.mock.calls[2]?.[0] as Record<string, unknown>;
    const activitySelection = select.mock.calls[3]?.[0] as Record<string, unknown>;
    expect(inspectionSelection).not.toHaveProperty("photoKeys");
    expect(maintenanceSelection).not.toHaveProperty("invoiceDocumentKey");
    expect(activitySelection).not.toHaveProperty("metadata");
    expect(activitySelection).not.toHaveProperty("actorUserId");
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

  it("rejects likely sensitive content before an inspection review note is stored", async () => {
    const caller = appRouter.createCaller(adminContext as never);
    await expect(caller.operations.vehiclePassports.reviewInspection({ inspectionId: 12, status: "needs_attention", reviewNote: "PIN: 1234 must not be recorded here." })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("records a human inspection review without changing vehicle readiness", async () => {
    const reviewValues = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn(() => terminalWithLimit([{ id: 12, vehiclePassportId: 91 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: reviewValues })) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
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
      select: vi.fn(() => terminalWithLimit([{ id: 5, vehiclePassportId: 91 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };
    mockedGetDb.mockResolvedValue(db as never);
    const completedAt = new Date("2026-09-03T15:30:00Z");

    await expect(caller.operations.vehiclePassports.updateMaintenanceStatus({ maintenanceId: 5, status: "completed", completedAt })).resolves.toEqual({ success: true, status: "completed", vehicleReadinessChanged: false });
    expect(db.update).toHaveBeenCalled();
    expect(updateWhere).toHaveBeenCalled();
  });

  it("stores a maintenance invoice privately and returns it only through an administrator-only signed access action", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(terminalWithLimit([{ id: 7, vehiclePassportId: 91 }]))
        .mockReturnValueOnce(terminalWithLimit([{ invoiceDocumentKey: "private/maintenance-invoice.pdf" }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };
    mockedGetDb.mockResolvedValue(db as never);
    mockedStoragePut.mockResolvedValue({ key: "private/maintenance-invoice.pdf", url: "/manus-storage/private/maintenance-invoice.pdf" });
    mockedStorageGetSignedUrl.mockResolvedValue("https://example.invalid/maintenance-invoice" as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.vehiclePassports.uploadMaintenanceInvoice({ maintenanceId: 7, filename: "invoice.pdf", contentType: "application/pdf", base64: Buffer.alloc(32, 1).toString("base64") })).resolves.toEqual({ success: true });
    await expect(caller.operations.vehiclePassports.maintenanceInvoiceUrl({ maintenanceId: 7 })).resolves.toEqual({ url: "https://example.invalid/maintenance-invoice" });
    expect(mockedStorageGetSignedUrl).toHaveBeenCalledWith("private/maintenance-invoice.pdf");
  });

  it("rate limits repeated maintenance invoice uploads for the same administrator account", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn(() => terminalWithLimit([{ id: 9, vehiclePassportId: 91 }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };
    mockedGetDb.mockResolvedValue(db as never);
    mockedStoragePut.mockResolvedValue({ key: "private/maintenance-invoice.pdf", url: "/manus-storage/private/maintenance-invoice.pdf" });
    const caller = appRouter.createCaller(adminContext as never);
    const input = { maintenanceId: 9, filename: "invoice.pdf", contentType: "application/pdf" as const, base64: Buffer.alloc(32, 1).toString("base64") };

    for (let attempt = 0; attempt < 12; attempt += 1) await expect(caller.operations.vehiclePassports.uploadMaintenanceInvoice(input)).resolves.toEqual({ success: true });
    await expect(caller.operations.vehiclePassports.uploadMaintenanceInvoice(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
