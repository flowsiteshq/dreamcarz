import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("operations access control", () => {
  it("rejects member access before any operational data is queried", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 22,
        openId: "member-only",
        name: "Member",
        email: "member@example.com",
        loginMethod: "direct",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} },
      res: {},
    } as never);

    await expect(caller.operations.getQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
