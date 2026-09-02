import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const adminOperations = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AdminOperations.tsx"), "utf8");

describe("DreamCarz Administrator Command Center", () => {
  it("keeps fleet, customers, DCP governance, reviews, and operations in the role-gated administrator workspace", () => {
    expect(adminOperations).toContain("Administrator command center");
    expect(adminOperations).toContain('label: "Fleet"');
    expect(adminOperations).toContain('label: "Customers"');
    expect(adminOperations).toContain('label: "DCP & pricing"');
    expect(adminOperations).toContain('label: "Review queue"');
    expect(adminOperations).toContain('label: "Operations"');
    expect(adminOperations).toContain('user?.role !== "admin"');
  });

  it("does not present unconfigured DCP conversion or redemption as an active administrative capability", () => {
    expect(adminOperations).toContain("DCP monetary conversion and redemption stay unconfigured");
    expect(adminOperations).toContain("DCP is not cash");
  });
});
