import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };
const assignmentTerminal = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) });

describe("DreamCarz role assignment governance", () => {
  beforeEach(() => mockedGetDb.mockReset());

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

  it("rejects role changes before any database access for non-administrators", async () => {
    await expect(appRouter.createCaller(memberContext as never).roles.assign({ userId: 91, role: "support" })).rejects.toThrow("Administrator access is required");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
