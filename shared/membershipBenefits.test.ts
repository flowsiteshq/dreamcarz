import { describe, expect, it } from "vitest";
import { evaluateActiveMembershipBenefits, membershipAllowsVehicle } from "./membershipBenefits";

describe("DreamCarz membership benefit evaluation", () => {
  it("uses only valid configured active benefits and leaves access unrestricted when no explicit vehicle list exists", () => {
    const effects = evaluateActiveMembershipBenefits([
      { benefitType: "rental_credit", label: "Ride credit", configuration: '{"amountCents":2500}' },
      { benefitType: "upgrade_priority", label: "Priority", configuration: '{"enabled":true}' },
      { benefitType: "deposit_adjustment", label: "Bad configuration", configuration: "not-json" },
    ]);

    expect(effects.rentalCreditCents).toBe(2500);
    expect(effects.depositAdjustmentCents).toBe(0);
    expect(effects.upgradePriority).toBe(true);
    expect(membershipAllowsVehicle(effects, "2024-chevrolet-malibu-gray")).toBe(true);
  });

  it("enforces explicit configured vehicle access without inferring entitlements", () => {
    const effects = evaluateActiveMembershipBenefits([
      { benefitType: "vehicle_access", label: "Confirmed access", configuration: '{"vehicleIds":["2024-chevrolet-malibu-gray"]}' },
    ]);

    expect(membershipAllowsVehicle(effects, "2024-chevrolet-malibu-gray")).toBe(true);
    expect(membershipAllowsVehicle(effects, "2022-chevrolet-traverse-white")).toBe(false);
  });
});
