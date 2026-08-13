import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);

const memberContext = {
  user: {
    id: 8,
    openId: "member-service-report-test",
    name: "Member",
    email: "member@example.com",
    loginMethod: "direct",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { headers: {} },
  res: {},
};

const adminContext = {
  ...memberContext,
  user: { ...memberContext.user, id: 1, openId: "admin-service-report-test", role: "admin" as const },
};

describe("service-report router workflow", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
  });

  it("persists a submitted review event when a member creates a service report", async () => {
    const limit = vi.fn().mockResolvedValue([{ vehicleName: "2025 Porsche Taycan" }]);
    const orderBy = vi.fn(() => ({ limit }));
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const reportValues = vi.fn().mockResolvedValue([{ insertId: 88 }]);
    const eventValues = vi.fn().mockResolvedValue({ affectedRows: 1 });
    const insert = vi
      .fn()
      .mockReturnValueOnce({ values: reportValues })
      .mockReturnValueOnce({ values: eventValues });
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from })), insert } as never);

    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.serviceReports.create({
      category: "Maintenance",
      description: "The vehicle requires a routine service inspection.",
      urgency: "standard",
      photos: [],
    })).resolves.toMatchObject({ success: true });

    expect(eventValues).toHaveBeenCalledWith({ reportId: 88, status: "submitted", note: "Report received" });
    expect(reportValues).toHaveBeenCalledWith(expect.objectContaining({ vehicleName: "2025 Porsche Taycan" }));
  });

  it("does not create a report with a placeholder vehicle when the member has no confirmed reservation", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const orderBy = vi.fn(() => ({ limit }));
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const insert = vi.fn();
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from })), insert } as never);

    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.serviceReports.create({
      category: "Maintenance",
      description: "The vehicle requires a routine service inspection.",
      urgency: "standard",
      photos: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("persists the administrator, status, and note across multi-step service-report review transitions", async () => {
    const where = vi.fn().mockResolvedValue({ affectedRows: 1 });
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const eventValues = vi.fn().mockResolvedValue({ affectedRows: 1 });
    const insert = vi.fn(() => ({ values: eventValues }));
    mockedGetDb.mockResolvedValue({ update, insert } as never);

    const caller = appRouter.createCaller(adminContext as never);
    await expect(caller.operations.reviewServiceReport({ id: 88, status: "assigned", reviewNote: "Assigned for review." })).resolves.toEqual({ success: true });
    await expect(caller.operations.reviewServiceReport({ id: 88, status: "resolved", reviewNote: "Repair completed." })).resolves.toEqual({ success: true });

    expect(set).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "assigned", reviewNote: "Assigned for review." }));
    expect(set).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "resolved", reviewNote: "Repair completed." }));
    expect(eventValues).toHaveBeenNthCalledWith(1, { reportId: 88, reviewerId: 1, status: "assigned", note: "Assigned for review." });
    expect(eventValues).toHaveBeenNthCalledWith(2, { reportId: 88, reviewerId: 1, status: "resolved", note: "Repair completed." });
  });

  it("rejects a member attempting to change a service-report status", async () => {
    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.operations.reviewServiceReport({ id: 88, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
