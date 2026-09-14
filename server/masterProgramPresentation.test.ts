import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const pricingSource = readFileSync(resolve(root, "client/src/pages/Pricing.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(root, "client/src/pages/Dashboard.tsx"), "utf8");

describe("master program presentation safeguards", () => {
  it("uses the active database configuration for public membership explanations", () => {
    expect(routerSource).toContain("getActiveMasterProgramConfiguration");
    expect(routerSource).toContain("master_program_membership_configuration");
    expect(routerSource).toContain("not a final vehicle quote");
  });

  it("renders pricing from the active master configuration rather than a static plan price table", () => {
    expect(pricingSource).toContain("trpc.masterProgram.publicConfiguration.useQuery");
    expect(pricingSource).toContain("Starting DCPR");
    expect(pricingSource).toContain("Not a final quote");
    expect(pricingSource).not.toContain("$2,399 setup");
  });

  it("keeps the member dashboard wallet-specific without presenting generic credit as DCP value", () => {
    expect(dashboardSource).toContain("DCP wallet structure");
    expect(dashboardSource).toContain("Recorded by wallet");
    expect(dashboardSource).toContain("not cash");
    expect(dashboardSource).not.toContain("Recorded account value.");
  });
});
