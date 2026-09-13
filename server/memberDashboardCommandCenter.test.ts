import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/Dashboard.tsx"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardShell.tsx"), "utf8");

describe("member dashboard command center", () => {
  it("uses authenticated records and confirmed inventory instead of illustrative member data", () => {
    expect(dashboardSource).toContain("trpc.dreamcarzId.overview.useQuery");
    expect(dashboardSource).toContain("APPROVED_TRANSACTION_VEHICLES");
    expect(dashboardSource).toContain("Editorial image · not current inventory");
    expect(dashboardSource).not.toContain("2024 Range Rover Sport");
    expect(dashboardSource).not.toContain("$2,450");
  });

  it("keeps the dashboard Concierge entry functional and routes typed prompts into Concierge", () => {
    expect(shellSource).toContain("saveHomepageConciergePrompt(aiInput)");
    expect(shellSource).toContain('navigate("/concierge")');
    expect(shellSource).toContain('label: "My Dashboard"');
    expect(shellSource).toContain("isDashboardHome");
  });
});
