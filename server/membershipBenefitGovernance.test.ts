import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.32" }, res: {} };

describe("DreamCarz membership benefit governance", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("rejects benefit activation before configuration can reach the database", async () => {
    await expect(appRouter.createCaller(adminContext as never).memberships.addBenefit({ membershipPlanId: 1, benefitType: "rental_discount", label: "Unapproved discount", configuration: JSON.stringify({ amountCents: 100 }), activate: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
