import { describe, expect, it } from "vitest";
import { COMING_SOON_VEHICLE_CATEGORIES, comingSoonVehicleCatalog, findComingSoonVehicle, getComingSoonVehicle } from "./comingSoonVehicles";

describe("comingSoonVehicleCatalog", () => {
  it("offers at least 50 planned vehicle options across every required category without treating them as current inventory", () => {
    expect(comingSoonVehicleCatalog).toHaveLength(58);
    expect(new Set(comingSoonVehicleCatalog.map((vehicle) => vehicle.type))).toEqual(new Set(COMING_SOON_VEHICLE_CATEGORIES));
    expect(comingSoonVehicleCatalog.every((vehicle) => vehicle.availability === "coming-soon")).toBe(true);
    expect(comingSoonVehicleCatalog.every((vehicle) => vehicle.id.startsWith("coming-soon-"))).toBe(true);
  });

  it("returns planned entries only through the waitlist catalog lookup", () => {
    expect(getComingSoonVehicle("coming-soon-2024-tesla-model-3")).toMatchObject({ make: "Tesla", model: "Model 3", availability: "coming-soon" });
    expect(findComingSoonVehicle("Can I join the waiting list for a Cadillac Escalade?")).toMatchObject({ make: "Cadillac", model: "Escalade", availability: "coming-soon" });
    expect(getComingSoonVehicle("2024-chevrolet-malibu-gray")).toBeNull();
  });
});
