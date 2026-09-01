import { describe, expect, it } from "vitest";
import { shouldShowVehicleClassChoice } from "./Concierge";

describe("shouldShowVehicleClassChoice", () => {
  it("shows visual body-style choices only after the relevant rental or purchase question", () => {
    expect(shouldShowVehicleClassChoice({
      intent: "rental",
      vehicleClass: null,
      hasSelectedVehicle: false,
      latestConciergeMessage: "I can help with rental options. Would you prefer a sedan or an SUV?",
    })).toBe(true);
  });

  it("keeps the minimal thread clear outside an explicit sedan-or-SUV question", () => {
    expect(shouldShowVehicleClassChoice({ intent: "rental", vehicleClass: null, hasSelectedVehicle: false, latestConciergeMessage: "When would you like to drive?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "explore", vehicleClass: null, hasSelectedVehicle: false, latestConciergeMessage: "Would you prefer a sedan or an SUV?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "purchase", vehicleClass: "sedan", hasSelectedVehicle: false, latestConciergeMessage: "Would you prefer a sedan or an SUV?" })).toBe(false);
    expect(shouldShowVehicleClassChoice({ intent: "purchase", vehicleClass: null, hasSelectedVehicle: true, latestConciergeMessage: "Would you prefer a sedan or an SUV?" })).toBe(false);
  });
});
