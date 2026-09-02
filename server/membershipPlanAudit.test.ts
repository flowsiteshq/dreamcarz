import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(resolve(import.meta.dirname, "../client/src", relativePath), "utf8");

describe("membership-plan audit", () => {
  it("keeps the approved seven membership path names while omitting illustrative plan amounts", () => {
    const pricing = readClientFile("pages/Pricing.tsx");
    const fleet = readClientFile("pages/Fleet.tsx");
    const vehicleDetail = readClientFile("pages/VehicleDetail.tsx");
    const membershipPage = readClientFile("pages/dashboard/MembershipPage.tsx");

    for (const name of ["Freedom", "Plus", "Pro", "Elite", "Silver", "Gold", "Black"]) {
      expect(pricing).toContain(`name: "${name}"`);
      expect(fleet).toContain(`name: "${name}"`);
      expect(vehicleDetail).toContain(`name: "${name}"`);
      expect(membershipPage).toContain(`name: "${name}"`);
    }

    for (const amount of ["$199", "$499", "$1,499", "$2,965", "$4,785", "$9,985", "$24,950", "$1,250 monthly"]) {
      expect(pricing).not.toContain(amount);
      expect(fleet).not.toContain(amount);
      expect(vehicleDetail).not.toContain(amount);
    }
  });

  it("removes stale plan price and DCP conversion claims from public support and legal text", () => {
    const faq = readClientFile("pages/FAQ.tsx");
    const calculator = readClientFile("pages/Calculator.tsx");
    const terms = readClientFile("pages/TermsConditions.tsx");

    expect(faq).not.toContain("$39.95/mo");
    expect(faq).not.toContain("1.2x multiplier");
    expect(calculator).not.toContain("$39.95 / month");
    expect(terms).toContain("Freedom, Plus, Pro, Elite, Silver, Gold, and Black");
    expect(terms).not.toContain("Freedom membership currently starts at $39.95");
  });
});
