import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("DreamCarz pricing experience", () => {
  it("separates membership pricing from vehicle-specific access costs", () => {
    const pricing = read("client/src/pages/Pricing.tsx");

    expect(pricing).toContain("Membership is one cost.");
    expect(pricing).toContain("Your vehicle is another.");
    expect(pricing).toContain("one-time enrollment");
    expect(pricing).toContain("Vehicle access comes next");
    expect(pricing).toContain("joining a membership does not include a vehicle");
    expect(pricing).toContain("$199");
    expect(pricing).toContain("$39 monthly");
    expect(pricing).toContain("$499");
    expect(pricing).toContain("$99 monthly");
    expect(pricing).toContain("$24,950");
    expect(pricing).toContain("$1,250 monthly");
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
