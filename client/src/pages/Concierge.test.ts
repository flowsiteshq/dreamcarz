import { describe, expect, it } from "vitest";
import { shouldShowVehicleClassChoice } from "@/lib/conciergeFlow";

describe("shouldShowVehicleClassChoice", () => {
  it("shows visual body-style choices only after the relevant rental or purchase question", () => {
    expect(shouldShowVehicleClassChoice({
      intent: "rental",
      vehicleClass: null,
      hasSelectedVehicle: false,
      latestConciergeMessage: "Hi Vincent. What type of vehicle are you looking to rent?",
    })).toBe(true);
  });

  it("keeps the minimal thread clear outside an explicit sedan-or-SUV question", () => {
    expect(shouldShowVehicleClassChoice({ intent: "rental", vehicleClass: null, hasSelectedVehicle: false, latestConciergeMessage: "When would you like to drive?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "explore", vehicleClass: null, hasSelectedVehicle: false, latestConciergeMessage: "What type of vehicle are you looking to rent?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "purchase", vehicleClass: "sedan", hasSelectedVehicle: false, latestConciergeMessage: "What type of vehicle are you looking to buy?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "purchase", vehicleClass: null, hasSelectedVehicle: true, latestConciergeMessage: "What type of vehicle are you looking to buy?" })).toBe(false);
  });
});
