import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const fleetPartnerContext = {
  user: { id: 45, name: "Assigned Partner", email: "partner@example.test", role: "user" },
  req: { headers: {} },
  res: {},
};

function queryResult<T>(value: T) {
  return { from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(value) })) };
}

describe("fleetPartner.overview activity", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("returns only minimal assigned-vehicle operations data without transaction, customer, document, location, acquisition, or financial fields", async () => {
    const select = vi.fn()
      .mockReturnValueOnce(queryResult([{ role: "fleet_partner" }]))
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) })
      .mockReturnValueOnce(queryResult([{ vehiclePassportId: 8 }]))
      .mockReturnValueOnce(queryResult([{ id: 8, vehicleName: "2024 Chevrolet Malibu · Gray", readinessStatus: "available" }]))
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([]) })) })) })
      .mockReturnValueOnce(queryResult([{ vehicleName: "2024 Chevrolet Malibu · Gray" }]));
    mockedGetDb.mockResolvedValue({ select } as never);

    const result = await appRouter.createCaller(fleetPartnerContext as never).fleetPartner.overview();

    expect(result.activity).toEqual([{ vehiclePassportId: 8, vehicleName: "2024 Chevrolet Malibu · Gray", activeRentalCount: 1 }]);
    expect(JSON.stringify(result.activity)).not.toContain("reference");
    expect(JSON.stringify(result.activity)).not.toContain("customer");
    expect(result.vehicles).toEqual([{ id: 8, vehicleName: "2024 Chevrolet Malibu · Gray", readinessStatus: "available" }]);
    const serializedVehicles = JSON.stringify(result.vehicles);
    for (const restrictedField of ["DocumentKey", "currentLocation", "acquisition", "insurancePolicy", "vinLast4", "plateNumber", "notes"]) {
      expect(serializedVehicles).not.toContain(restrictedField);
    }
    const projections = select.mock.calls.map(([projection]) => projection).filter(Boolean) as Array<Record<string, unknown>>;
    const profileProjection = projections.find(projection => "businessName" in projection && "status" in projection);
    const maintenanceProjection = projections.find(projection => "maintenanceType" in projection);
    const inspectionProjection = projections.find(projection => "stage" in projection);
    const incidentProjection = projections.find(projection => "incidentType" in projection);
    expect(profileProjection).not.toHaveProperty("notes");
    expect(maintenanceProjection).not.toHaveProperty("invoiceDocumentKey");
    expect(maintenanceProjection).not.toHaveProperty("notes");
    expect(inspectionProjection).not.toHaveProperty("photoKeys");
    expect(inspectionProjection).not.toHaveProperty("damageNotes");
    expect(incidentProjection).not.toHaveProperty("photoKeys");
    expect(incidentProjection).not.toHaveProperty("reportedLocation");
    expect(incidentProjection).not.toHaveProperty("description");
  });

  it("rejects likely card numbers before Fleet Partner maintenance text is stored", async () => {
    mockedGetDb.mockResolvedValue({} as never);

    await expect(appRouter.createCaller(fleetPartnerContext as never).fleetPartner.requestMaintenance({ vehiclePassportId: 8, maintenanceType: "repair", notes: "Charge 4111 1111 1111 1111 for repair" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects labeled driver-license values before Fleet Partner incident text is stored", async () => {
    mockedGetDb.mockResolvedValue({} as never);

    await expect(appRouter.createCaller(fleetPartnerContext as never).fleetPartner.reportIncident({ vehiclePassportId: 8, incidentType: "damage", severity: "standard", description: "Driver license number: AB-12345 was reported." })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
