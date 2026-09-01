import { describe, expect, it } from "vitest";
import { vehicleIdsForClass } from "../client/src/pages/Concierge";

describe("Concierge body-style choice", () => {
  it("returns matching confirmed vehicle IDs so cards render immediately after a style is selected", () => {
    const inventory = [
      { vehicleId: "malibu", vehicleClass: "sedan" },
      { vehicleId: "traverse", vehicleClass: "suv" },
      { vehicleId: "fusion", vehicleClass: "sedan" },
    ];

    expect(vehicleIdsForClass(inventory, "sedan")).toEqual(["malibu", "fusion"]);
    expect(vehicleIdsForClass(inventory, "suv")).toEqual(["traverse"]);
  });
});
