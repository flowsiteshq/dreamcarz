import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const memberContext = { user: { id: 77, name: "Member", email: "member@example.test", role: "user" }, req: { headers: {} }, res: {} };

describe("communications.markAllRead", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("marks only the caller's unread notices and records one minimal read event per notice", async () => {
    const unread = [{ id: 8 }, { id: 9 }];
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(unread) })) }));
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const eventsValues = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockResolvedValue({ select, update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: eventsValues })) } as never);

    await expect(appRouter.createCaller(memberContext as never).communications.markAllRead()).resolves.toEqual({ success: true, markedCount: 2 });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(eventsValues).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 77, notificationId: 8, channel: "in_app", status: "read" }),
      expect.objectContaining({ userId: 77, notificationId: 9, channel: "in_app", status: "read" }),
    ]);
  });

  it("does not write events when the caller has no unread notices", async () => {
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) }));
    const update = vi.fn();
    const insert = vi.fn();
    mockedGetDb.mockResolvedValue({ select, update, insert } as never);

    await expect(appRouter.createCaller(memberContext as never).communications.markAllRead()).resolves.toEqual({ success: true, markedCount: 0 });
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
