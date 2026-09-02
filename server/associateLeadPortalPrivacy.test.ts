import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const portal = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AssociatePortal.tsx"), "utf8");

describe("Associate lead contact privacy presentation", () => {
  it("only renders lead contact details after the existing contact-consent check", () => {
    expect(portal).toContain("lead.consentToContact");
    expect(portal).toContain("Contact consent is not recorded.");
    expect(portal).toContain("Your private audit timeline records only a lead reference");
  });
});
