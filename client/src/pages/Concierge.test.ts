import { describe, expect, it } from "vitest";
import { conciergeComposerPlaceholder, shouldShowVehicleClassChoice } from "@/lib/conciergeFlow";

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

describe("conciergeComposerPlaceholder", () => {
  it("uses secure answer instructions and retains the underlying Concierge context for general questions", () => {
    expect(conciergeComposerPlaceholder({ field: "email" })).toBe("Enter your email address…");
    expect(conciergeComposerPlaceholder({ field: "name" })).toBe("Enter your name…");
    expect(conciergeComposerPlaceholder({ field: "password" })).toBe("Create a secure password…");
    expect(conciergeComposerPlaceholder({ field: "existingPassword" })).toBe("Enter your password…");
    expect(conciergeComposerPlaceholder({ field: "email", askingGeneralQuestion: true, selectedVehicleName: "2024 Chevrolet Malibu · Gray" })).toBe("Ask about this Chevrolet Malibu…");
  });

  it("changes the prompt for discovery, reservation assistance, and member context", () => {
    expect(conciergeComposerPlaceholder({ field: null })).toBe("What car are you looking for?");
    expect(conciergeComposerPlaceholder({ field: null, hasActiveReservation: true })).toBe("Need help with your reservation?");
    expect(conciergeComposerPlaceholder({ field: null, isMember: true })).toBe("Ask DreamCarz anything…");
  });
});
