import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(resolve(process.cwd(), "client/src/components/AdministratorServiceNotice.tsx"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("administrator in-app service notice safeguards", () => {
  it("limits notices to one selected account and states the no-external-delivery boundary", () => {
    expect(workspace).toContain("Create one private service notice for one selected account");
    expect(workspace).toContain("does not send email, SMS, or push");
    expect(workspace).toContain("Do not include payment card data");
  });

  it("validates the recipient, restricts sensitive content, and rate limits notice creation server-side", () => {
    expect(router).toContain('"administrator_in_app_notice"');
    expect(router).toContain('assertSafeRestrictedContent(input.title, "operational report")');
    expect(router).toContain('assertSafeRestrictedContent(input.body, "operational report")');
    expect(router).toContain('"Customer account not found."');
  });
});
