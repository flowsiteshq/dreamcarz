import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const portal = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPortal.tsx"), "utf8");
const operations = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AdminOperations.tsx"), "utf8");

describe("separate administrator portal", () => {
  it("routes /admin to a dedicated administrator portal", () => {
    expect(app).toContain('path="/admin" component={AdminPortal}');
    expect(portal).toContain("Secure administrator access");
    expect(portal).toContain("AdministratorLogin");
  });

  it("keeps operational controls role-gated and outside the member dashboard shell", () => {
    expect(portal).toContain('user?.role !== "admin"');
    expect(portal).toContain("AdminOperationsContent");
    expect(operations).toContain("export function AdminOperationsContent");
    expect(operations).toContain('<DashboardShell title="Operations"><AdminOperationsContent /></DashboardShell>');
  });
});
