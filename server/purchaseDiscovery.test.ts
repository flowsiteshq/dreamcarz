import { describe, expect, it } from "vitest";
import { detectPurchaseVehicleType, emptyPurchaseDiscovery, matchingPurchaseInventory, nextPurchaseStep, purchasePriorityReply, purchaseQuestion, purchaseVehicleTypeReply } from "../client/src/lib/purchaseDiscovery";

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

  it("uses human conversational language for guided questions and selected replies", () => {
    const discovery = { ...emptyPurchaseDiscovery(), vehicleType: "suv" as const };
    expect(purchaseQuestion("vehicle_type", discovery)).toContain("let’s make this easy");
    expect(purchaseQuestion("priority", discovery)).toContain("When you picture your suv");
    expect(purchaseVehicleTypeReply("suv")).toBe("I’d like an SUV.");
    expect(purchasePriorityReply("family_space")).toContain("family and gear");
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
