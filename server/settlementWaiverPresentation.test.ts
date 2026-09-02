import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(resolve(process.cwd(), "client/src/components/SettlementManager.tsx"), "utf8");

describe("manual settlement waiver presentation", () => {
  it("exposes the existing waived status without presenting a refund or charge action", () => {
    expect(workspace).toContain('finalizeSettlement("waived")');
    expect(workspace).toContain("Mark waived");
    expect(workspace).toContain("does not issue a refund, reverse a charge, or initiate any payment action");
  });
});
