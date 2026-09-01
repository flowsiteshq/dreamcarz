import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conciergeSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Concierge.tsx"), "utf8");

describe("Concierge saved decisions", () => {
  it("shows account-owned vehicle, timing, and current-step decisions without restoring chat history", () => {
    expect(conciergeSource).toContain('aria-label="Saved Concierge choices"');
    expect(conciergeSource).toContain("savedPathVehicle");
    expect(conciergeSource).toContain("savedPathTimeline");
    expect(conciergeSource).toContain("savedPathStep");
    expect(conciergeSource).not.toContain('id: "restored", role: "concierge"');
  });
});
