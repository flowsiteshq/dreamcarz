import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const portal = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AssociatePortal.tsx"), "utf8");

describe("Associate commission ledger presentation", () => {
  it("shows only recorded commission entries and avoids a payout implication", () => {
    expect(portal).toContain("Commission ledger");
    expect(portal).toContain("commissionRecords.map");
    expect(portal).toContain("not a compensation approval, eligibility decision, tax statement, or payout instruction");
  });
});
