import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conciergeSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");
const workspaceSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/ConciergeWorkspace.tsx"), "utf8");

describe("selected-vehicle Concierge workspace", () => {
  it("keeps the conversation in a dashboard workspace after a vehicle is selected", () => {
    expect(conciergeSource).toContain("const dashboardMode = Boolean(selectedVehicleId || enrollmentReference || savedJourney?.selectedVehicleId || activeTransaction)");
    expect(conciergeSource).toContain("<ConciergeWorkspace dashboard={dashboardMode}");
    expect(workspaceSource).toContain("Your selected vehicle and next step stay together here.");
    expect(workspaceSource).toContain("Ask a question anytime. Your enrollment stays at the exact next step.");
  });

  it("guides guests to create an account and returns them to their selected Concierge path", () => {
    expect(conciergeSource).toContain("Create your DreamCarz dashboard to keep this vehicle and continue securely.");
    expect(conciergeSource).toContain("navigate(`/login?next=${encodeURIComponent(`/concierge?intent=${intent === \"purchase\" ? \"purchase\" : \"rental\"}`)}`)");
    expect(workspaceSource).toContain("Create your dashboard");
  });
});
