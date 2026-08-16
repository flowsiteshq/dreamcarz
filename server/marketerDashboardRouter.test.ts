import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const marketerContext = {
  user: {
    id: 72,
    openId: "marketer-dashboard-test",
    name: "Marketer",
    email: "marketer@example.com",
    loginMethod: "direct",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { headers: {} },
  res: {},
};

function terminal(value: unknown) {
  return { limit: vi.fn().mockResolvedValue(value) };
}

describe("marketer dashboard router", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("returns live direct, active, recorded-commission, and referral-link readiness metrics", async () => {
    const profile = { userId: 72, rank: "driver", referralCode: "DC72LIVE", totalEarned: 129900 };
    const referrals = [
      { id: 1, status: "active", level: 1 },
      { id: 2, status: "pending", level: 1 },
      { id: 3, status: "inactive", level: 1 },
    ];
    const currentMonthCommission = { total: 22300 };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([profile])) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(referrals) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([currentMonthCommission])) })) });
    mockedGetDb.mockResolvedValue({ select } as never);

    const caller = appRouter.createCaller(marketerContext as never);
    await expect(caller.driveNetwork.getStats()).resolves.toEqual({
      teamSize: 3,
      directReferrals: 3,
      activeDirectReferrals: 1,
      totalEarned: 129900,
      thisMonthTotal: 22300,
      rank: "driver",
      referralCode: "DC72LIVE",
    });
  });

  it("maps real direct-team rows without exposing demo residual amounts", async () => {
    const rows = [{
      id: 4,
      userId: 83,
      name: "Jordan Member",
      email: "jordan@example.com",
      level: 1,
      status: "active",
      joinedAt: new Date("2026-08-01T00:00:00.000Z"),
      rank: "associate",
    }];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const where = vi.fn(() => ({ orderBy }));
    const leftJoin = vi.fn(() => ({ where }));
    const innerJoin = vi.fn(() => ({ leftJoin }));
    const from = vi.fn(() => ({ innerJoin }));
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from })) } as never);

    const caller = appRouter.createCaller(marketerContext as never);
    await expect(caller.driveNetwork.getDownline()).resolves.toEqual(rows);
    expect(rows[0]).not.toHaveProperty("residual");
    expect(rows[0]).not.toHaveProperty("monthlyFee");
  });

  it("registers a valid referral only when no relationship already exists", async () => {
    const referralProfile = { userId: 83, referralCode: "DC83LIVE" };
    const values = vi.fn().mockResolvedValue({ affectedRows: 1 });
    const insert = vi.fn(() => ({ values }));
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([referralProfile])) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([])) })) });
    mockedGetDb.mockResolvedValue({ select, insert } as never);

    const caller = appRouter.createCaller(marketerContext as never);
    await expect(caller.driveNetwork.registerReferral({ referralCode: "DC83LIVE" })).resolves.toEqual({ success: true });
    expect(values).toHaveBeenCalledWith({ referrerId: 83, referredId: 72, level: 1, status: "active" });
  });

  it("rejects self-referral and duplicate referral attempts", async () => {
    const selfSelect = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([{ userId: 72, referralCode: "DC72SELF" }])) })) });
    mockedGetDb.mockResolvedValue({ select: selfSelect } as never);
    const caller = appRouter.createCaller(marketerContext as never);
    await expect(caller.driveNetwork.registerReferral({ referralCode: "DC72SELF" })).resolves.toEqual({ success: false, error: "Cannot refer yourself" });

    const duplicateSelect = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([{ userId: 83, referralCode: "DC83LIVE" }])) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => terminal([{ id: 10 }])) })) });
    mockedGetDb.mockResolvedValue({ select: duplicateSelect } as never);
    await expect(caller.driveNetwork.registerReferral({ referralCode: "DC83LIVE" })).resolves.toEqual({ success: false, error: "Already referred" });
  });
});
