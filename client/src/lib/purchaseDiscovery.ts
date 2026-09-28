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

export const purchaseVehicleTypeReply = (vehicleType: PurchaseVehicleType) => ({
  suv: "I’d like an SUV.",
  sedan: "I’m looking for a sedan.",
  truck: "I need a truck.",
  sports_luxury: "I’m after something sporty or luxurious.",
  ev_hybrid: "I’d like an EV or hybrid.",
  not_sure: "I’m not sure yet — I’d like your help narrowing it down.",
})[vehicleType];

export const purchasePriorityReply = (priority: Exclude<PurchasePriority, null>) => ({
  low_payment: "Keeping the payment comfortable matters most to me.",
  luxury: "I want something that feels more premium.",
  reliability: "I want a dependable everyday vehicle.",
  performance: "I want something fun and responsive to drive.",
  family_space: "I need room for family and gear.",
  fuel_economy: "Fuel efficiency is important to me.",
})[priority];

export const purchaseConditionReply = (condition: Exclude<PurchaseCondition, null>) => ({
  new: "I’m leaning toward new.",
  used: "I’m open to a pre-owned vehicle.",
  either: "I’m open to new or pre-owned.",
})[condition];

export const purchaseBudgetStyleReply = (budgetStyle: Exclude<PurchaseBudgetStyle, null>) => ({
  monthly_payment: "I’d like to start with a monthly payment that works for me.",
  total_price: "I’d rather start with the overall vehicle price.",
  both: "Show me both the price and a payment scenario.",
})[budgetStyle];

export const purchaseUseReply = (primaryUse: Exclude<PurchaseUse, null>) => ({
  family: "It’ll mainly be for family and passengers.",
  commuting: "It’ll mainly be for commuting and everyday driving.",
  work: "I’ll mainly use it for work or cargo.",
  weekends: "It’s mostly for weekends and lifestyle driving.",
  not_sure: "I’m still figuring that part out.",
})[primaryUse];

export const purchaseQuestion = (step: PurchaseDiscoveryStep, discovery: PurchaseDiscovery) => {
  if (step === "vehicle_type") {
    return "Absolutely — let’s make this easy. What kind of vehicle feels like the right fit: something roomy, easy for everyday driving, work-ready, sporty, or fuel-saving?";
  }
  if (step === "priority") {
    const vehicle = discovery.vehicleType ? purchaseVehicleTypeLabel(discovery.vehicleType).toLowerCase() : "next vehicle";
    return `Good choice. When you picture your ${vehicle}, what matters most to you?`;
  }
  if (step === "condition") return "That helps. Are you leaning toward something new, open to a pre-owned vehicle, or happy to see both?";
  if (step === "budget_style") return "One quick question so I can keep this useful: would you rather start with a comfortable monthly payment or an overall price range?";
  if (step === "use") return "Last one, then I’ll show you a few places to start. What will this vehicle do most often — family trips, commuting, work, or weekends?";
  return "Thanks — based on what you shared, here are a few confirmed DreamCarz vehicles worth a closer look. We’ll verify the live details with you before you make any decision.";
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
  if (/\b(suv|crossover|family\s+(?:vehicle|car))\b/.test(value)) return "suv";
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
