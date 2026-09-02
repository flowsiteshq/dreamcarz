import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");

describe("Concierge dashboard creation", () => {
  it("uses one conversational question at a time for guest account creation", () => {
    expect(source).toContain("I’ll create your DreamCarz dashboard and keep this vehicle path here. What email should we use?");
    expect(source).toContain("I found your DreamCarz dashboard. Enter your password to sign in and continue.");
    expect(source).toContain("Great. What should I call you?");
    expect(source).toContain("Create a secure password. Use at least 10 characters.");
  });

  it("keeps password entry masked and offers a question interruption path", () => {
    expect(source).toContain('type={secureFieldActive && (dashboardCreationField === "password" || dashboardCreationField === "existingPassword") ? "password" : "text"}');
    expect(source).toContain('placeholder={composerPlaceholder}');
    expect(source).toContain("Ask a question instead");
    expect(source).toContain("When you’re ready");
    expect(source).toContain("register.mutateAsync({ name: dashboardName, email: dashboardEmail, password: rawValue, acceptedTerms: true })");
  });
});
