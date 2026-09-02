import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { resetRateLimitsForTests } from "./rateLimit";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };
const assignmentTerminal = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) });

describe("DreamCarz role assignment governance", () => {
  beforeEach(() => { mockedGetDb.mockReset(); resetRateLimitsForTests(); });

  it("records an immutable role_granted event when an administrator grants a new operational role", async () => {
    const values = vi.fn().mockResolvedValueOnce([{ insertId: 42 }]).mockResolvedValueOnce(undefined);
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => assignmentTerminal([])), insert: vi.fn(() => ({ values })) } as never);

    await expect(appRouter.createCaller(adminContext as never).roles.assign({ userId: 91, role: "support" })).resolves.toEqual({ success: true, restored: false, alreadyActive: false });
    expect(values).toHaveBeenNthCalledWith(1, { userId: 91, role: "support", assignedByUserId: 1 });
    expect(values).toHaveBeenNthCalledWith(2, { roleAssignmentId: 42, targetUserId: 91, actorUserId: 1, role: "support", eventType: "role_granted" });
  });

  it("records an immutable role_revoked event only after revoking an active assignment", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => assignmentTerminal([{ id: 42 }])), update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values })) } as never);

    await expect(appRouter.createCaller(adminContext as never).roles.revoke({ userId: 91, role: "support" })).resolves.toEqual({ success: true });
    expect(updateWhere).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith({ roleAssignmentId: 42, targetUserId: 91, actorUserId: 1, role: "support", eventType: "role_revoked" });
  });

  it("returns only bounded immutable role-change details with minimal staff attribution", async () => {
    const recordedAt = new Date("2026-09-02T12:00:00.000Z");
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([{ id: 8, actorUserId: 4, role: "support", eventType: "role_granted", createdAt: recordedAt }]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 4, name: "Operations Lead" }]) })) });
    mockedGetDb.mockResolvedValue({ select } as never);

    await expect(appRouter.createCaller(adminContext as never).roles.historyForUser({ userId: 91, page: 1, pageSize: 8 })).resolves.toEqual({
      items: [{ id: 8, role: "support", eventType: "role_granted", createdAt: recordedAt, actorName: "Operations Lead" }],
      total: 1,
      page: 1,
      pageSize: 8,
    });
  });

  it("rejects role changes before any database access for non-administrators", async () => {
    await expect(appRouter.createCaller(memberContext as never).roles.assign({ userId: 91, role: "support" })).rejects.toThrow("Administrator access is required");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("prevents an administrator from revoking their own operational role before database access", async () => {
    await expect(appRouter.createCaller(adminContext as never).roles.revoke({ userId: 1, role: "operations" })).rejects.toThrow("You cannot revoke your own operational role");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("restricts immutable role-change history to administrators before database access", async () => {
    await expect(appRouter.createCaller(memberContext as never).roles.historyForUser({ userId: 91 })).rejects.toThrow("Administrator access is required");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("rate-limits administrator directory and role-history reads before database access", async () => {
    mockedGetDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(adminContext as never);
    for (let attempt = 0; attempt < 120; attempt += 1) await caller.roles.directory({ page: 1, pageSize: 10 });
    await expect(caller.roles.directory({ page: 1, pageSize: 10 })).rejects.toThrow("Too many administrator account-directory requests");
    for (let attempt = 0; attempt < 120; attempt += 1) await caller.roles.historyForUser({ userId: 91 });
    await expect(caller.roles.historyForUser({ userId: 91 })).rejects.toThrow("Too many administrator role-history requests");
  });
});
