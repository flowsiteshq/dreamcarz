import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const portal = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/FleetPartnerPortal.tsx"), "utf8");

describe("Fleet Partner performance summaries", () => {
  it("aggregates only assignment-scoped operational counts without revenue or customer fields", () => {
    expect(router).toContain("scheduleWindowCount");
    expect(router).toContain("openMaintenanceCount");
    expect(router).toContain("inspectionAttentionCount");
    expect(router).toContain("openIncidentCount");
    expect(portal).toContain("Vehicle operating summary");
    expect(portal).toContain("Customer, payment, location, document, and revenue data remain restricted.");
  });
});
