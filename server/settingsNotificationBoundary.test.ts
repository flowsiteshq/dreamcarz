import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settings = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/SettingsPage.tsx"), "utf8");

describe("account settings notification boundaries", () => {
  it("removes non-persistent external notification toggles and links to the private notification center", () => {
    expect(settings).toContain('href="/dashboard/notifications"');
    expect(settings).toContain("Provider not configured");
    expect(settings).not.toContain("setNotifications");
    expect(settings).not.toContain("Pro Member · Since 2026");
    expect(settings).not.toContain(">Edit</button>");
  });
});
