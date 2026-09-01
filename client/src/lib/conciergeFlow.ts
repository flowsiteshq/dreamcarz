export type ConciergeIntent = "rental" | "purchase" | "membership" | "explore";
export type ConciergeVehicleClass = "sedan" | "suv" | null;

export function shouldShowVehicleClassChoice(input: {
  intent: ConciergeIntent;
  vehicleClass: ConciergeVehicleClass;
  hasSelectedVehicle: boolean;
  latestConciergeMessage: string;
}) {
  return !input.vehicleClass
    && !input.hasSelectedVehicle
    && (input.intent === "rental" || input.intent === "purchase")
    && /\b(?:vehicle|sedan|suv)\b/i.test(input.latestConciergeMessage)
    && /\b(?:type|sedan|suv)\b/i.test(input.latestConciergeMessage);
}

export function vehicleIdsForClass(
  vehicles: ReadonlyArray<{ vehicleId: string; vehicleClass: string }>,
  choice: Exclude<ConciergeVehicleClass, null>,
) {
  return vehicles.filter(vehicle => vehicle.vehicleClass === choice).map(vehicle => vehicle.vehicleId);
}
