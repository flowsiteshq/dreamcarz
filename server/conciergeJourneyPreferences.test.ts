import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({ consumeRateLimit: vi.fn(() => ({ allowed: true })), rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`) }));

import { getDb } from "./db";
import { consumeRateLimit } from "./rateLimit";
import { appRouter } from "./routers";

const context = { user: { id: 57, name: "Concierge Customer", email: "customer@example.com", role: "user" }, req: { headers: {} }, res: {} };

describe("concierge journey preferences", () => {
  beforeEach(() => { vi.mocked(getDb).mockReset(); vi.mocked(consumeRateLimit).mockReset(); vi.mocked(consumeRateLimit).mockReturnValue({ allowed: true, remaining: 11, retryAfterMs: 0 }); });

  it("returns only confirmed DreamCarz inventory through the public concierge", async () => {
    const vehicles = await appRouter.createCaller({ req: { headers: {} }, res: {} } as never).concierge.confirmedVehicles();
    expect(vehicles).toHaveLength(8);
    expect(vehicles.map(vehicle => vehicle.vehicleName)).toEqual(expect.arrayContaining(["2024 Chevrolet Malibu", "2022 Chevrolet Traverse", "2024 Ford Fusion", "2020 Chevrolet Traverse", "2019 Chevrolet Malibu", "2015 Ford Taurus", "2020 Chevrolet Equinox"]));
    expect(JSON.stringify(vehicles)).not.toContain("Tesla");
  });

  it("rejects unconfirmed vehicle selections before database access", async () => {
    await expect(appRouter.createCaller(context as never).concierge.saveJourneyPreference({ intent: "rental", preferredVehicleClass: "sedan", selectedVehicleId: "coming-soon-tesla", timeline: "soon", confirmSave: true })).rejects.toThrow("confirmed DreamCarz inventory vehicle");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("stores only explicit approved vehicle-path choices and derives the vehicle name server-side", async () => {
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) }));
    const values = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    vi.mocked(getDb).mockResolvedValue({ select, insert: vi.fn(() => ({ values })) } as never);

    await expect(appRouter.createCaller(context as never).concierge.saveJourneyPreference({ intent: "rental", preferredVehicleClass: "sedan", selectedVehicleId: "2024-chevrolet-malibu-gray", timeline: "this_week", confirmSave: true })).resolves.toMatchObject({ success: true, preference: { selectedVehicleName: "2024 Chevrolet Malibu" } });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 57, selectedVehicleId: "2024-chevrolet-malibu-gray", selectedVehicleName: "2024 Chevrolet Malibu", intent: "rental", timeline: "this_week" }));
    expect(JSON.stringify(values.mock.calls)).not.toContain("customer@example.com");
  });

  it("blocks preference saving before lookup when its bounded account limit is reached", async () => {
    vi.mocked(consumeRateLimit).mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
    await expect(appRouter.createCaller(context as never).concierge.saveJourneyPreference({ intent: "rental", preferredVehicleClass: null, selectedVehicleId: null, timeline: null, confirmSave: true })).rejects.toThrow("Please wait before updating your DreamCarz concierge preferences");
    expect(getDb).not.toHaveBeenCalled();
  });
});
