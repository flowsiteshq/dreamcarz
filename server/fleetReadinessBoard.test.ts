import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const board = readFileSync(resolve(process.cwd(), "client/src/components/FleetReadinessBoard.tsx"), "utf8");
const adminOperations = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/AdminOperations.tsx"), "utf8");

describe("fleet readiness board", () => {
  it("uses live Vehicle Passport and calendar queries instead of illustrative operational data", () => {
    expect(board).toContain("trpc.operations.vehiclePassports.list.useQuery");
    expect(board).toContain("trpc.operations.fleetCalendar.useQuery");
    expect(board).toContain("No Vehicle Passports have been created for confirmed inventory.");
  });

  it("keeps customer, payment, location, document, and vehicle-note details out of the board", () => {
    expect(board).toContain("Customer, payment, location, document, and vehicle-note details remain in their controlled records.");
    expect(board).not.toContain("contactEmail");
    expect(board).not.toContain("paymentProvider");
    expect(board).not.toContain("currentLocation");
    expect(adminOperations).toContain("FleetReadinessBoard");
  });
});
