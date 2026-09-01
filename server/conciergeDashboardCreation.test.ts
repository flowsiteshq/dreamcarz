import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");

describe("Concierge dashboard creation", () => {
  it("uses one conversational question at a time for guest account creation", () => {
    expect(source).toContain("Let me gather a few details and create your DreamCarz dashboard. What should I call you?");
    expect(source).toContain("Thank you. What email should we use?");
    expect(source).toContain("Create a secure password. Use at least 10 characters.");
  });

  it("keeps password entry masked and offers a question interruption path", () => {
    expect(source).toContain('type={dashboardCreationField === "password" && !dashboardQuestionMode ? "password" : "text"}');
    expect(source).toContain("Ask a question instead");
    expect(source).toContain("When you’re ready");
    expect(source).toContain("register.mutateAsync({ name: dashboardName, email: dashboardEmail, password: rawValue, acceptedTerms: true })");
  });
});
