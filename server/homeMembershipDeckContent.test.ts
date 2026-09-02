import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(resolve(import.meta.dirname, "../client/src", relativePath), "utf8");

describe("homepage and membership deck content", () => {
  it("uses the approved focused public experience without illustrative deck pricing", () => {
    const home = readClientFile("pages/Home.tsx");
    const membership = readClientFile("pages/Membership.tsx");

    expect(home).toContain("What do you need today?");
    expect(home).toContain("From question to next step.");
    expect(home).toContain("DCP is not cash.");
    expect(home).not.toContain("$59.95/day");
    expect(home).not.toContain("Save $10/day");
    expect(membership).toContain("DCP is not cash or a guaranteed discount.");
    expect(membership).not.toContain("$1,250/mo");
  });

  it("keeps the member package page focused on confirmed access and DCP rules", () => {
    const membershipPage = readClientFile("pages/dashboard/MembershipPage.tsx");

    expect(membershipPage).toContain("Your need");
    expect(membershipPage).toContain("DCP rules");
    expect(membershipPage).toContain("confirmed sedan and SUV options");
  });
});
