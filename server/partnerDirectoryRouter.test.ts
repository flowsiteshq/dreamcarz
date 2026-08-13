import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);

const memberContext = {
  user: {
    id: 12,
    openId: "member-partner-test",
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
  user: { ...memberContext.user, id: 1, openId: "admin-partner-test", role: "admin" as const },
};

describe("partner directory router", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
  });

  it("returns only active matching records from the member search procedure", async () => {
    const rows = [
      { id: 1, name: "Capital Auto Body & Repair", category: "repair", address: "4521 Kenilworth Ave", city: "Bladensburg", state: "MD", tags: "Collision,Mechanical", isActive: 1 },
      { id: 2, name: "Tesla Supercharger — Lanham", category: "charging", address: "9200 Basil Court", city: "Largo", state: "MD", tags: "Tesla,Supercharger", isActive: 0 },
    ];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from })) } as never);

    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.partners.list({ category: "repair", query: "kenilworth" })).resolves.toEqual([rows[0]]);
  });

  it("allows an administrator to deactivate a directory record", async () => {
    const where = vi.fn().mockResolvedValue({ affectedRows: 1 });
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mockedGetDb.mockResolvedValue({ update } as never);

    const caller = appRouter.createCaller(adminContext as never);
    await expect(caller.partners.setActive({ id: 22, isActive: false })).resolves.toEqual({ success: true });
    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ isActive: 0 });
    expect(where).toHaveBeenCalledTimes(1);
  });

  it("rejects non-administrators before a partner activation mutation runs", async () => {
    const caller = appRouter.createCaller(memberContext as never);
    await expect(caller.partners.setActive({ id: 22, isActive: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
