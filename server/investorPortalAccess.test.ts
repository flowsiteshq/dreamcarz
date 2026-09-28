import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("investor portal access boundaries", () => {
  it("requires the investor role and leaves payments outside the portal", () => {
    const router = read("server/routers.ts");
    const page = read("client/src/pages/InvestorPortal.tsx");
    expect(router).toContain("requireInvestorWorkspaceAccess");
    expect(router).toContain('eq(userRoleAssignments.role, "investor")');
    expect(router).toContain("savePlanningAmount");
    expect(page).toContain("No card, bank, wire, wallet, or payment information");
    expect(page).toContain("not an investment, payment, reservation, or ownership allocation");
  });
});
