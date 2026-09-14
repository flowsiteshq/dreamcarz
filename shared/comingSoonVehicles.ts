export const COMING_SOON_VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "EV",
  "Truck",
  "Luxury",
  "Performance",
  "Family",
  "Utility",
] as const;

export type ComingSoonVehicleCategory = (typeof COMING_SOON_VEHICLE_CATEGORIES)[number];
export type ComingSoonAccess = "entry" | "mid-range" | "elite";

export type ComingSoonVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  type: ComingSoonVehicleCategory;
  access: ComingSoonAccess;
  availability: "coming-soon";
  image: string;
};

const categoryVisuals: Record<ComingSoonVehicleCategory, string> = {
  Sedan: "/manus-storage/coming-soon-sedan_aa0918ac.png",
  SUV: "/manus-storage/coming-soon-suv_3021dbbf.png",
  EV: "/manus-storage/coming-soon-electric_d97d27a2.png",
  Truck: "/manus-storage/coming-soon-pickup_b074d08c.png",
  Luxury: "/manus-storage/coming-soon-luxury_d1efed55.png",
  Performance: "/manus-storage/coming-soon-performance_c2140c59.png",
  Family: "/manus-storage/coming-soon-family_2e2a432e.png",
  Utility: "/manus-storage/coming-soon-utility_86f85824.png",
};

function plannedVehicle(
  year: number,
  make: string,
  model: string,
  type: ComingSoonVehicleCategory,
  access: ComingSoonAccess,
): ComingSoonVehicle {
  const id = `coming-soon-${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    id,
    year,
    make,
    model,
    color: "To be confirmed",
    type,
    access,
    availability: "coming-soon",
    image: categoryVisuals[type],
  };
}

/**
 * Planned-interest catalog only. These vehicles are not confirmed DreamCarz
 * inventory, do not carry a quoted rate, and must always enter the waitlist flow.
 */
export const comingSoonVehicleCatalog: readonly ComingSoonVehicle[] = [
  // Sedan — 10 options (including the existing Tesla Model 3 request path)
  plannedVehicle(2021, "Nissan", "Altima", "Sedan", "entry"),
  plannedVehicle(2022, "Toyota", "Camry XSE", "Sedan", "mid-range"),
  plannedVehicle(2024, "Tesla", "Model 3", "Sedan", "elite"),
  plannedVehicle(2023, "Mercedes-Benz", "E-Class", "Sedan", "elite"),
  plannedVehicle(2025, "Honda", "Accord", "Sedan", "entry"),
  plannedVehicle(2025, "Hyundai", "Sonata", "Sedan", "entry"),
  plannedVehicle(2025, "Kia", "K5", "Sedan", "mid-range"),
  plannedVehicle(2025, "Acura", "Integra", "Sedan", "mid-range"),
  plannedVehicle(2025, "BMW", "3 Series", "Sedan", "elite"),
  plannedVehicle(2025, "Lexus", "ES", "Sedan", "elite"),

  // SUV — 14 options
  plannedVehicle(2025, "Toyota", "RAV4", "SUV", "entry"),
  plannedVehicle(2025, "Honda", "CR-V", "SUV", "entry"),
  plannedVehicle(2025, "Hyundai", "Tucson", "SUV", "entry"),
  plannedVehicle(2025, "Kia", "Sportage", "SUV", "entry"),
  plannedVehicle(2025, "Mazda", "CX-5", "SUV", "mid-range"),
  plannedVehicle(2025, "Ford", "Explorer", "SUV", "mid-range"),
  plannedVehicle(2025, "Jeep", "Grand Cherokee", "SUV", "mid-range"),
  plannedVehicle(2025, "Toyota", "Highlander", "SUV", "mid-range"),
  plannedVehicle(2025, "Honda", "Pilot", "SUV", "mid-range"),
  plannedVehicle(2025, "Chevrolet", "Tahoe", "SUV", "elite"),
  plannedVehicle(2025, "Ford", "Expedition", "SUV", "elite"),
  plannedVehicle(2025, "BMW", "X5", "SUV", "elite"),
  plannedVehicle(2025, "Mercedes-Benz", "GLE", "SUV", "elite"),
  plannedVehicle(2025, "Cadillac", "Escalade", "SUV", "elite"),

  // Electric vehicles — 8 options
  plannedVehicle(2025, "Tesla", "Model Y", "EV", "mid-range"),
  plannedVehicle(2025, "Ford", "Mustang Mach-E", "EV", "mid-range"),
  plannedVehicle(2025, "Hyundai", "IONIQ 5", "EV", "mid-range"),
  plannedVehicle(2025, "Kia", "EV6", "EV", "mid-range"),
  plannedVehicle(2025, "Chevrolet", "Blazer EV", "EV", "mid-range"),
  plannedVehicle(2025, "Nissan", "Ariya", "EV", "mid-range"),
  plannedVehicle(2025, "Volvo", "EX30", "EV", "elite"),
  plannedVehicle(2025, "Rivian", "R1S", "EV", "elite"),

  // Trucks — 7 options
  plannedVehicle(2025, "Ford", "F-150", "Truck", "mid-range"),
  plannedVehicle(2025, "Chevrolet", "Silverado 1500", "Truck", "mid-range"),
  plannedVehicle(2025, "Ram", "1500", "Truck", "mid-range"),
  plannedVehicle(2025, "Toyota", "Tacoma", "Truck", "mid-range"),
  plannedVehicle(2025, "GMC", "Sierra 1500", "Truck", "elite"),
  plannedVehicle(2025, "Ford", "Maverick", "Truck", "entry"),
  plannedVehicle(2025, "Rivian", "R1T", "Truck", "elite"),

  // Luxury — 6 options
  plannedVehicle(2025, "Mercedes-Benz", "S-Class", "Luxury", "elite"),
  plannedVehicle(2025, "BMW", "7 Series", "Luxury", "elite"),
  plannedVehicle(2025, "Audi", "A8", "Luxury", "elite"),
  plannedVehicle(2025, "Lexus", "LS", "Luxury", "elite"),
  plannedVehicle(2025, "Genesis", "G90", "Luxury", "elite"),
  plannedVehicle(2025, "Cadillac", "CT5", "Luxury", "elite"),

  // Performance — 5 options
  plannedVehicle(2025, "Ford", "Mustang", "Performance", "mid-range"),
  plannedVehicle(2025, "Chevrolet", "Corvette", "Performance", "elite"),
  plannedVehicle(2025, "BMW", "M4", "Performance", "elite"),
  plannedVehicle(2025, "Mercedes-Benz", "AMG GT", "Performance", "elite"),
  plannedVehicle(2025, "Porsche", "911", "Performance", "elite"),

  // Family — 4 options
  plannedVehicle(2025, "Toyota", "Sienna", "Family", "mid-range"),
  plannedVehicle(2025, "Honda", "Odyssey", "Family", "mid-range"),
  plannedVehicle(2025, "Kia", "Carnival", "Family", "mid-range"),
  plannedVehicle(2025, "Chrysler", "Pacifica", "Family", "mid-range"),

  // Utility — 4 options
  plannedVehicle(2025, "Ford", "Transit", "Utility", "mid-range"),
  plannedVehicle(2025, "Mercedes-Benz", "Sprinter", "Utility", "elite"),
  plannedVehicle(2025, "Ram", "ProMaster", "Utility", "mid-range"),
  plannedVehicle(2025, "Chevrolet", "Express", "Utility", "mid-range"),
];

export function getComingSoonVehicle(vehicleId: string | null | undefined) {
  return comingSoonVehicleCatalog.find((vehicle) => vehicle.id === vehicleId) ?? null;
}

export function findComingSoonVehicle(question: string) {
  const normalizedQuestion = question.toLowerCase();
  return comingSoonVehicleCatalog.find((vehicle) => {
    const makeAndModel = `${vehicle.make} ${vehicle.model}`.toLowerCase();
    const model = vehicle.model.toLowerCase();
    return normalizedQuestion.includes(makeAndModel) || (model.length >= 4 && normalizedQuestion.includes(model));
  }) ?? null;
}
