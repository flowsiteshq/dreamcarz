import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const shell = readFileSync(resolve(process.cwd(), "client/src/components/DashboardShell.tsx"), "utf8");

describe("administrator route navigation", () => {
  it("matches the specific administrator route before the generic member dashboard", () => {
    expect(app.indexOf('path="/dashboard/admin"')).toBeLessThan(app.indexOf('path="/dashboard"'));
    expect(app).toContain('path="/dashboard/admin" component={AdminOperations}');
  });

  it("shows an Admin Panel link only for the administrator role", () => {
    const adminLinks = shell.slice(shell.indexOf("const operatingLinks"), shell.indexOf("if (loading)"));
    expect(adminLinks).toContain('user?.role === "admin"');
    expect(adminLinks).toContain('{ href: "/dashboard/admin", label: "Admin Panel", icon: ShieldCheck }');
  });
});
