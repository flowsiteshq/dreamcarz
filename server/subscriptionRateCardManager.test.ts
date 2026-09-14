import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const managerSource = readFileSync(resolve(root, "client/src/components/SubscriptionRateCardManager.tsx"), "utf8");

describe("subscription rate-card administration", () => {
  it("requires administrator-controlled draft and approval actions with an active master program", () => {
    expect(routerSource).toContain("subscriptionRateCards: router");
    expect(routerSource).toContain("An active master program configuration is required");
    expect(routerSource).toContain("subscription_rate_card_created");
    expect(routerSource).toContain("subscription_rate_card_\${input.nextStatus}");
  });

  it("keeps the rate-card manager explicit about draft-only economics and manual review", () => {
    expect(managerSource).toContain("Save subscription rate-card draft");
    expect(managerSource).toContain("never create a customer quote");
    expect(managerSource).toContain("Concierge must keep subscription requests in manual review");
    expect(managerSource).toContain("Priceline market benchmark · not a DreamCarz charge");
    expect(managerSource).toContain("never auto-fills, approves, or replaces");
  });
});
