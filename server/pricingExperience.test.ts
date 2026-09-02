import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("DreamCarz pricing experience", () => {
  it("shows the approved membership paths without presenting illustrative amounts as live terms", () => {
    const pricing = read("client/src/pages/Pricing.tsx");

    expect(pricing).toContain("Choose your path.");
    expect(pricing).toContain("Keep your vehicle terms clear.");
    expect(pricing).toContain("Terms are confirmed during selection.");
    expect(pricing).toContain("Vehicle access comes next");
    expect(pricing).toContain("membership does not include a vehicle");
    expect(pricing).toContain("Freedom");
    expect(pricing).toContain("Plus");
    expect(pricing).toContain("Pro");
    expect(pricing).toContain("Elite");
    expect(pricing).toContain("Silver");
    expect(pricing).toContain("Gold");
    expect(pricing).toContain("Black");
    expect(pricing).not.toContain("$24,950");
    expect(pricing).not.toContain("$1,250 monthly");
  });

  it("exposes pricing alongside membership and links vehicle access to confirmed inventory", () => {
    const app = read("client/src/App.tsx");
    const navigation = read("client/src/components/Navigation.tsx");
    const membership = read("client/src/pages/Membership.tsx");

    expect(app).toContain('<Route path="/pricing" component={Pricing} />');
    expect(navigation).toContain('{ href: "/pricing", label: "Pricing" }');
    expect(membership).toContain('href="/pricing"');
    expect(membership).toContain('href="/fleet"');
  });
});
