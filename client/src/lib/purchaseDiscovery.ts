export const PURCHASE_VEHICLE_TYPES = [
  "suv",
  "sedan",
  "truck",
  "sports_luxury",
  "ev_hybrid",
  "not_sure",
] as const;

export type PurchaseVehicleType = (typeof PURCHASE_VEHICLE_TYPES)[number];
export type PurchasePriority = "low_payment" | "luxury" | "reliability" | "performance" | "family_space" | "fuel_economy" | null;
export type PurchaseCondition = "new" | "used" | "either" | null;
export type PurchaseBudgetStyle = "monthly_payment" | "total_price" | "both" | null;
export type PurchaseUse = "family" | "commuting" | "work" | "weekends" | "not_sure" | null;
export type PurchaseDiscoveryStep = "vehicle_type" | "priority" | "condition" | "budget_style" | "use" | "results";

export type PurchaseDiscovery = {
  vehicleType: PurchaseVehicleType | null;
  priority: PurchasePriority;
  condition: PurchaseCondition;
  budgetStyle: PurchaseBudgetStyle;
  primaryUse: PurchaseUse;
};

export type PurchaseInventoryVehicle = {
  vehicleId: string;
  vehicleName: string;
  vehicleClass: "sedan" | "suv";
  image: string;
};

export const emptyPurchaseDiscovery = (): PurchaseDiscovery => ({
  vehicleType: null,
  priority: null,
  condition: null,
  budgetStyle: null,
  primaryUse: null,
});

export const purchaseVehicleTypeLabel = (vehicleType: PurchaseVehicleType) => ({
  suv: "SUV",
  sedan: "Sedan",
  truck: "Truck",
  sports_luxury: "Sports / Luxury",
  ev_hybrid: "EV / Hybrid",
  not_sure: "Not sure yet",
})[vehicleType];

export const purchasePriorityLabel = (priority: Exclude<PurchasePriority, null>) => ({
  low_payment: "Low payment",
  luxury: "Luxury",
  reliability: "Reliability",
  performance: "Performance",
  family_space: "Family space",
  fuel_economy: "Fuel economy",
})[priority];

export const purchaseConditionLabel = (condition: Exclude<PurchaseCondition, null>) => ({
  new: "New",
  used: "Used",
  either: "Either",
})[condition];

export const purchaseBudgetStyleLabel = (budgetStyle: Exclude<PurchaseBudgetStyle, null>) => ({
  monthly_payment: "Monthly payment",
  total_price: "Total price",
  both: "Show me both",
})[budgetStyle];

export const purchaseUseLabel = (primaryUse: Exclude<PurchaseUse, null>) => ({
  family: "Family / passengers",
  commuting: "Daily commuting",
  work: "Work / cargo",
  weekends: "Weekends / lifestyle",
  not_sure: "Not sure yet",
})[primaryUse];

export const purchaseQuestion = (step: PurchaseDiscoveryStep, discovery: PurchaseDiscovery) => {
  if (step === "vehicle_type") {
    return "Absolutely. I’ll help you find the right vehicle and explore purchase options that fit what you’re looking for. What type of vehicle are you looking for?";
  }
  if (step === "priority") {
    return `Great. What matters most in your ${discovery.vehicleType ? purchaseVehicleTypeLabel(discovery.vehicleType) : "next vehicle"}?`;
  }
  if (step === "condition") return "Would you prefer new, used, or either?";
  if (step === "budget_style") return "Would you rather shop by total vehicle price or monthly payment?";
  if (step === "use") return "How will you use this vehicle most?";
  return "I found confirmed DreamCarz vehicles to start with. These are the strongest matches based on what you shared; final availability, condition, pricing, financing, and location are confirmed by DreamCarz.";
};

const purchaseStepTransitions: Record<Exclude<PurchaseDiscoveryStep, "results">, PurchaseDiscoveryStep> = {
  vehicle_type: "priority",
  priority: "condition",
  condition: "budget_style",
  budget_style: "use",
  use: "results",
};

export const nextPurchaseStep = (step: Exclude<PurchaseDiscoveryStep, "results">): PurchaseDiscoveryStep => purchaseStepTransitions[step];

export function detectPurchaseVehicleType(text: string): PurchaseVehicleType | null {
  const value = text.toLowerCase();
  if (/\b(suv|crossover|family vehicle)\b/.test(value)) return "suv";
  if (/\b(sedan|saloon)\b/.test(value)) return "sedan";
  if (/\b(truck|pickup)\b/.test(value)) return "truck";
  if (/\b(sports?|luxury|performance)\b/.test(value)) return "sports_luxury";
  if (/\b(ev|electric|hybrid)\b/.test(value)) return "ev_hybrid";
  if (/\b(not sure|anything|no preference)\b/.test(value)) return "not_sure";
  return null;
}

export function matchingPurchaseInventory(vehicles: readonly PurchaseInventoryVehicle[], discovery: PurchaseDiscovery) {
  const desiredClass = discovery.vehicleType === "suv" || discovery.vehicleType === "sedan" ? discovery.vehicleType : null;
  const matchingClass = desiredClass ? vehicles.filter(vehicle => vehicle.vehicleClass === desiredClass) : vehicles;
  return matchingClass.length ? matchingClass : vehicles;
}

export function purchaseMatchLabel(vehicle: PurchaseInventoryVehicle, discovery: PurchaseDiscovery) {
  if (discovery.vehicleType === vehicle.vehicleClass) return "Strong match";
  if (discovery.vehicleType === "not_sure" || !discovery.vehicleType) return "Explore match";
  return "Alternative match";
}
