import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: true })),
  rateLimitKey: vi.fn(() => "future-driver-test"),
}));

import { appRouter } from "./routers";

const user = {
  id: 707,
  openId: "future-driver-user",
  email: "future@example.com",
  name: "Future Driver",
  loginMethod: "direct",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const context = { user, req: { protocol: "https", headers: {} }, res: {} } as never;

function whereLimit(rows: unknown[]) {
  return { limit: vi.fn().mockResolvedValue(rows) };
}

describe("futureDriver router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDb.mockReset();
  });

  it("creates a neutral account-owned goal and immutable event without DCP, wallet, or reservation writes", async () => {
    const profileInsert = vi.fn().mockResolvedValue([{ insertId: 81 }]);
    const eventInsert = vi.fn().mockResolvedValue([]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => whereLimit([])) })) })),
      insert: vi.fn()
        .mockReturnValueOnce({ values: profileInsert })
        .mockReturnValueOnce({ values: eventInsert }),
    };
    getDb.mockResolvedValue(db);

    const result = await appRouter.createCaller(context).futureDriver.saveGoal({
      goalArea: "vehicle_discovery",
      desiredVehicleId: "2024-ford-fusion-gray",
      horizon: "exploring",
    });

    expect(result).toEqual({ success: true, profileId: 81 });
    expect(profileInsert).toHaveBeenCalledWith(expect.objectContaining({ userId: 707, mode: "future_driver", desiredVehicleId: "2024-ford-fusion-gray" }));
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ futureDriverProfileId: 81, eventType: "future_driver_profile_created", toMode: "future_driver" }));
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("rejects unconfirmed vehicle preferences before creating a profile or event", async () => {
    const db = { select: vi.fn(), insert: vi.fn() };
    getDb.mockResolvedValue(db);

    await expect(appRouter.createCaller(context).futureDriver.saveGoal({
      goalArea: "vehicle_discovery",
      desiredVehicleId: "not-confirmed",
      horizon: "exploring",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("records an immutable account-owned mode change without changing the saved goal", async () => {
    const profile = { id: 81, userId: 707, mode: "future_driver", goalArea: "vehicle_discovery", desiredVehicleId: null, horizon: "exploring" };
    const eventInsert = vi.fn().mockResolvedValue([]);
    const updateWhere = vi.fn().mockResolvedValue([]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => whereLimit([profile])) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: eventInsert })),
    };
    getDb.mockResolvedValue(db);

    const result = await appRouter.createCaller(context).futureDriver.setMode({ mode: "inactive" });

    expect(result).toEqual({ success: true, unchanged: false });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ futureDriverProfileId: 81, eventType: "future_driver_mode_changed", fromMode: "future_driver", toMode: "inactive" }));
  });
});
