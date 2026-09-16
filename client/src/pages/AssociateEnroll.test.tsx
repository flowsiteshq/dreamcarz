import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Associate enrollment checkout readiness", () => {
  it("enables checkout from consent rather than relying on a stale client provider-ready flag", () => {
    const source = readFileSync(resolve(import.meta.dirname, "AssociateEnroll.tsx"), "utf8");
    expect(source).toContain("disabled={!authorizeRecurring || startCheckout.isPending || completeCheckout.isPending}");
    expect(source).not.toContain("!status.data?.providerReady");
  });
});
