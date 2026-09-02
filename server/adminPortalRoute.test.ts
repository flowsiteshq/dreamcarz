import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const portal = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPortal.tsx"), "utf8");
const operations = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AdminOperations.tsx"), "utf8");
const serviceLog = readFileSync(resolve(process.cwd(), "client/src/components/VehicleServiceLog.tsx"), "utf8");
const roleManager = readFileSync(resolve(process.cwd(), "client/src/components/AdministratorUserRoleManager.tsx"), "utf8");
const passportManager = readFileSync(resolve(process.cwd(), "client/src/components/VehiclePassportManager.tsx"), "utf8");

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

  it("provides a separate preventive-maintenance workspace with controlled target dates", () => {
    expect(portal).toContain('{ label: "Maintenance", id: "admin-maintenance", icon: Wrench }');
    expect(operations).toContain('section id="admin-maintenance"');
    expect(operations).toContain("Preventive maintenance");
    expect(serviceLog).toContain("Target service date");
    expect(serviceLog).toContain("dueAt");
  });

  it("keeps user and role management inside the separate administrator portal", () => {
    expect(portal).toContain('{ label: "Users & roles", id: "admin-roles", icon: Users }');
    expect(operations).toContain("AdministratorUserRoleManager");
    expect(operations).toContain('{ id: "admin-roles", label: "Users & roles", summary: "Access administration"');
    expect(roleManager).toContain("trpc.roles.directory");
    expect(roleManager).toContain("trpc.roles.historyForUser");
    expect(roleManager).toContain("Role-change history");
    expect(roleManager).toContain("You cannot revoke your own operational role");
    expect(roleManager).toContain("Base administrator access is controlled outside this workspace");
    expect(roleManager).not.toContain('"administrator"');
    expect(roleManager).not.toContain("password");
  });

  it("provides an administrator-only selected Vehicle Passport operational timeline", () => {
    expect(passportManager).toContain("trpc.operations.vehiclePassports.operationalHistory");
    expect(passportManager).toContain("View timeline");
    expect(passportManager).toContain("Operational history excludes customer, payment, document-key, and exact-location data.");
  });
});
