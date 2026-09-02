import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockedGetDb } = vi.hoisted(() => ({ mockedGetDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mockedGetDb }));

import { appRouter } from "./routers";

const adminContext = { user: { id: 7, name: "Operator", email: "operator@example.test", role: "admin" }, req: { headers: {} }, res: {} };
const customerContext = { user: { id: 8, name: "Customer", email: "customer@example.test", role: "user" }, req: { headers: {} }, res: {} };

describe("communications.adminHistory", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("returns only minimized delivery-event fields to an administrator", async () => {
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 4, userId: 81, notificationId: 12, channel: "in_app", status: "delivered", createdAt: new Date("2026-09-02T14:00:00Z") }]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 81, name: "Jamie Driver", email: "jamie@example.test" }]) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 12, category: "transaction" }]) })) });
    mockedGetDb.mockResolvedValue({ select } as never);

    const result = await appRouter.createCaller(adminContext as never).communications.adminHistory({ page: 1, pageSize: 10 });

    expect(result).toMatchObject({ total: 1, items: [{ id: 4, customerName: "Jamie Driver", customerEmail: "jamie@example.test", channel: "in_app", status: "delivered", category: "transaction" }] });
    expect(result.items[0]).not.toHaveProperty("detail");
    expect(result.items[0]).not.toHaveProperty("providerReference");
  });

  it("rejects customers before communication history is queried", async () => {
    await expect(appRouter.createCaller(customerContext as never).communications.adminHistory()).rejects.toThrow("Administrator access is required");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });
});
