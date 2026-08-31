import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const context = { user: { id: 88, name: "Profile Customer", email: "profile@example.com", role: "user" }, req: { headers: {} }, res: {} };
const chain = (value: unknown[]) => {
  const terminal = Object.assign(Promise.resolve(value), {
    limit: vi.fn().mockResolvedValue(value),
    orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(value) })),
  });
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => terminal),
      innerJoin: vi.fn(() => ({ where: vi.fn(() => terminal) })),
    })),
  };
};

describe("DreamCarz ID concierge journey projection", () => {
  beforeEach(() => vi.mocked(getDb).mockReset());

  it("returns a member's saved vehicle-path preference without exposing chat, identity, or payment data", async () => {
    const journey = { id: 7, userId: 88, intent: "rental", preferredVehicleClass: "sedan", selectedVehicleId: "2024-chevrolet-malibu-gray", selectedVehicleName: "2024 Chevrolet Malibu", timeline: "this_week", savedAt: new Date(), updatedAt: new Date() };
    const select = vi.fn()
      .mockReturnValueOnce(chain([{ id: 1, profileStatus: "incomplete", identityStatus: "not_started", licenseStatus: "not_started" }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([journey]));
    vi.mocked(getDb).mockResolvedValue({ select } as never);

    const overview = await appRouter.createCaller(context as never).dreamcarzId.overview();

    expect(overview.conciergeJourney).toMatchObject({ intent: "rental", preferredVehicleClass: "sedan", selectedVehicleName: "2024 Chevrolet Malibu", timeline: "this_week" });
    expect(JSON.stringify(overview.conciergeJourney)).not.toContain("profile@example.com");
    expect(JSON.stringify(overview.conciergeJourney)).not.toContain("identityProviderSessionId");
    expect(JSON.stringify(overview.conciergeJourney)).not.toContain("payment");
  });
});
