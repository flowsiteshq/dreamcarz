import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const schemaSource = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const journeySource = readFileSync(resolve(root, "client/src/pages/dashboard/DreamJourney.tsx"), "utf8");

describe("Future Driver planning foundation", () => {
  it("stores only account-owned neutral goals and immutable mode events", () => {
    expect(schemaSource).toContain('future_driver_profiles');
    expect(schemaSource).toContain('future_driver_goal_events');
    expect(routerSource).toContain('futureDriver: router');
    expect(routerSource).toContain('future_driver_goal_updated');
    expect(routerSource).toContain('future_driver_mode_changed');
  });

  it("does not activate an accelerator schedule, benefit, DCP award, or reservation from planning", () => {
    const futureDriverSection = routerSource.slice(routerSource.indexOf('futureDriver: router'), routerSource.indexOf('dreamcarzId: router'));
    expect(futureDriverSection).not.toContain('dcpLedgerEntries');
    expect(futureDriverSection).not.toContain('walletLedgerEntries');
    expect(futureDriverSection).not.toContain('reservationRequests');
    expect(journeySource).toContain('Plan without promises.');
    expect(journeySource).toContain('does not create DCP');
    expect(journeySource).toContain('useEffect(() =>');
    expect(journeySource).toContain('setGoalArea(profile.goalArea)');
  });
});
