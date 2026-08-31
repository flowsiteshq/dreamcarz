import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const context = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };

describe("DreamCarz rental schedule router", () => {
  beforeEach(() => mockedGetDb.mockReset());
  it("rejects an invalid rental window before any schedule is persisted", async () => {
    const caller = appRouter.createCaller(context as never);
    await expect(caller.transactions.saveRentalSchedule({
      reference: "DCR-2026-SCHEDULE",
      requestedStartAt: new Date("2026-09-10T12:00:00.000Z"),
      requestedEndAt: new Date("2026-09-10T11:00:00.000Z"),
      pickupMethod: "pickup",
      pickupLocation: "DreamCarz Lanham",
    })).rejects.toThrow("Return time must be after pickup time");
  });

  it("requires the location detail appropriate to the selected handoff method", async () => {
    const caller = appRouter.createCaller(context as never);
    await expect(caller.transactions.saveRentalSchedule({
      reference: "DCR-2026-SCHEDULE",
      requestedStartAt: new Date("2026-09-10T10:00:00.000Z"),
      requestedEndAt: new Date("2026-09-12T10:00:00.000Z"),
      pickupMethod: "delivery",
    })).rejects.toThrow("Provide the requested delivery address");
  });

  it("rejects likely sensitive content before a rental schedule note accesses transaction records", async () => {
    const caller = appRouter.createCaller(context as never);
    await expect(caller.transactions.saveRentalSchedule({
      reference: "DCR-2026-SCHEDULE",
      requestedStartAt: new Date("2026-09-10T10:00:00.000Z"),
      requestedEndAt: new Date("2026-09-12T10:00:00.000Z"),
      pickupMethod: "pickup",
      pickupLocation: "DreamCarz Lanham",
      customerNotes: "Card number 4111 1111 1111 1111",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
