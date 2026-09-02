import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conciergeSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");
const workspaceSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/ConciergeWorkspace.tsx"), "utf8");

describe("selected-vehicle Concierge workspace", () => {
  it("keeps the conversation in a dashboard workspace after a vehicle is selected", () => {
    expect(conciergeSource).toContain("const dashboardMode = Boolean(selectedVehicleId || enrollmentReference || savedJourney?.selectedVehicleId || activeTransaction)");
    expect(conciergeSource).toContain("<ConciergeWorkspace dashboard={dashboardMode}");
    expect(workspaceSource).toContain("Ready to guide your next step.");
    expect(workspaceSource).toContain("Ask a question anytime. Your enrollment stays at the exact next step.");
    expect(workspaceSource).toContain("Saved ${path === \"rental\" ? \"rental\" : \"purchase\"} path");
    expect(workspaceSource).toContain("Resume ${path === \"rental\" ? \"rental\" : \"purchase\"}");
  });

  it("guides guests to create an account and returns them to their selected Concierge path", () => {
    expect(conciergeSource).toContain("I’ll create your dashboard here and keep this vehicle saved.");
    expect(conciergeSource).toContain("I’ll create your DreamCarz dashboard and keep this vehicle path here.");
    expect(conciergeSource).toContain("sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId }))");
    expect(workspaceSource).toContain("Create your dashboard");
  });
});
