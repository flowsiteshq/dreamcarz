import { describe, expect, it } from "vitest";
import { detectPurchaseVehicleType, emptyPurchaseDiscovery, matchingPurchaseInventory, nextPurchaseStep } from "../client/src/lib/purchaseDiscovery";

const vehicles = [
  { vehicleId: "sedan-1", vehicleName: "Confirmed Sedan", vehicleClass: "sedan" as const, image: "sedan.png" },
  { vehicleId: "suv-1", vehicleName: "Confirmed SUV", vehicleClass: "suv" as const, image: "suv.png" },
];

describe("purchase discovery", () => {
  it("detects a vehicle type from natural language without inventing inventory", () => {
    expect(detectPurchaseVehicleType("I need a family SUV")).toBe("suv");
    expect(detectPurchaseVehicleType("Show an EV or hybrid")).toBe("ev_hybrid");
    expect(detectPurchaseVehicleType("Anything works")).toBe("not_sure");
  });

  it("advances through the guided buying sequence", () => {
    expect(nextPurchaseStep("vehicle_type")).toBe("priority");
    expect(nextPurchaseStep("priority")).toBe("condition");
    expect(nextPurchaseStep("condition")).toBe("budget_style");
    expect(nextPurchaseStep("budget_style")).toBe("use");
    expect(nextPurchaseStep("use")).toBe("results");
  });

  it("shows only confirmed inventory that matches a supported vehicle class", () => {
    const discovery = { ...emptyPurchaseDiscovery(), vehicleType: "suv" as const };
    expect(matchingPurchaseInventory(vehicles, discovery).map(vehicle => vehicle.vehicleId)).toEqual(["suv-1"]);
  });

  it("keeps verified inventory available when the requested category has no confirmed match", () => {
    const discovery = { ...emptyPurchaseDiscovery(), vehicleType: "truck" as const };
    expect(matchingPurchaseInventory(vehicles, discovery).map(vehicle => vehicle.vehicleId)).toEqual(["sedan-1", "suv-1"]);
  });
});
