import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routers = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const calendar = readFileSync(resolve(process.cwd(), "client/src/components/FleetOperationsCalendar.tsx"), "utf8");
const fleetCalendarProcedure = routers.slice(routers.indexOf("fleetCalendar: protectedProcedure"), routers.indexOf("rentalExtensions: router"));

describe("fleet operations calendar", () => {
  it("is administrator-only and projects only scheduling-safe transaction context", () => {
    expect(fleetCalendarProcedure).toContain('ctx.user.role !== "admin"');
    expect(fleetCalendarProcedure).toContain("vehicleTransactions.vehicleName");
    expect(fleetCalendarProcedure).toContain("transactionSchedules.requestedStartAt");
    expect(fleetCalendarProcedure).toContain("transactionSchedules.handoffStatus");
    expect(fleetCalendarProcedure).not.toContain("contactName");
    expect(fleetCalendarProcedure).not.toContain("contactEmail");
    expect(fleetCalendarProcedure).not.toContain("deliveryAddress");
    expect(fleetCalendarProcedure).not.toContain("handoffNotes");
  });

  it("states the minimized schedule boundary in the administrator view", () => {
    expect(calendar).toContain("Customer contact, payment, location, and document details stay out of this schedule view.");
    expect(calendar).toContain("No future rental or purchase schedule windows have been recorded.");
  });
});
