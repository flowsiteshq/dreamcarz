import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const navigationSource = readFileSync(resolve(process.cwd(), "client/src/components/Navigation.tsx"), "utf8");

describe("DreamCarz navigation mega menu", () => {
  it("keeps desktop menu groups hover, focus, click, and escape accessible", () => {
    expect(navigationSource).toContain('aria-label="Primary navigation"');
    expect(navigationSource).toContain('onMouseEnter={() => setActiveMegaMenu("fleet")}');
    expect(navigationSource).toContain('onFocus={() => setActiveMegaMenu("fleet")}');
    expect(navigationSource).toContain('if (event.key === "Escape") setActiveMegaMenu(null)');
    expect(navigationSource).toContain('onMouseLeave={() => setActiveMegaMenu(null)}');
    expect(navigationSource).toContain('aria-controls="dreamcarz-fleet-menu"');
    expect(navigationSource).toContain('aria-controls="dreamcarz-members-menu"');
    expect(navigationSource).toContain('aria-controls="dreamcarz-network-menu"');
  });

  it("preserves confirmed-vehicle and existing navigation destinations across desktop and mobile", () => {
    for (const destination of [
      "/vehicle?id=2024-chevrolet-malibu-gray",
      "/vehicle?id=2022-chevrolet-traverse-white",
      "/vehicle?id=2024-ford-fusion-gray",
      "/fleet",
      "/concierge?intent=rental",
      "/concierge?intent=purchase",
      "/membership",
      "/pricing",
      "/contact",
      "/associates",
      "/opportunity#fleet-partner",
    ]) expect(navigationSource).toContain(destination);

    expect(navigationSource).toContain("mobileFleetOpen");
    expect(navigationSource).toContain("Confirmed vehicle preview");
    expect(navigationSource).toContain("fleetPreview");
  });
});
