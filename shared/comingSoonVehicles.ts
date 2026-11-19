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
  Sedan: "/manus-storage/car-card-1_8dfc0a4a.png",
  SUV: "/manus-storage/car-card-2_d8411d99.png",
  EV: "/manus-storage/car-card-3_23f3c0ab.png",
  Truck: "/manus-storage/car-card-4_6af95632.png",
  Luxury: "/manus-storage/car-card-5_bd8a563d.png",
  Performance: "/manus-storage/car-card-6_4972fbf1.png",
  Family: "/manus-storage/car-budget-7_1b4d2b9c.png",
  Utility: "/manus-storage/car-budget-8_9abf3a26.png",
};

const eliteVehicleVisuals: Record<string, string> = {
  "coming-soon-2024-tesla-model-3": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/oRmuWEECYLJaltsi.jpg",
  "coming-soon-2023-mercedes-benz-e-class": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/itvFPMbAHuRyEAGH.jpg",
  "coming-soon-2025-bmw-3-series": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HFFczqgaGtqayGyG.jpg",
  "coming-soon-2025-lexus-es": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/tbEteLzzkWzcmygt.jpg",
  "coming-soon-2025-chevrolet-tahoe": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/MsCLfKRrEMOWLgZt.jpg",
  "coming-soon-2025-ford-expedition": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/AEZXcXPzqVpjEDBI.jpg",
  "coming-soon-2025-bmw-x5": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/lYJKqWyTYmvCofYp.jpg",
  "coming-soon-2025-mercedes-benz-gle": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/EkOoyquynZCYngWv.jpg",
  "coming-soon-2025-cadillac-escalade": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/eHgvyIrCjoSGjELl.jpg",
  "coming-soon-2025-volvo-ex30": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BOgVcZsqYxyuiclu.jpg",
  "coming-soon-2025-rivian-r1s": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/dyldHEpeRlWjsJmO.jpg",
  "coming-soon-2025-gmc-sierra-1500": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HnuGtDmtwdYpqyJF.jpg",
  "coming-soon-2025-rivian-r1t": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xTGGyKOFuWDWelfR.jpg",
  "coming-soon-2025-mercedes-benz-s-class": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mGyEqHWvbXkGUcya.jpg",
  "coming-soon-2025-bmw-7-series": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/RZZSrnkgRLcSwEpx.jpg",
  "coming-soon-2025-audi-a8": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UceuRchitHfPoJrP.jpg",
  "coming-soon-2025-lexus-ls": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xWlXCHvMPxZoCnfG.jpg",
  "coming-soon-2025-genesis-g90": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/GnamDGwmewdYcpuR.jpg",
  "coming-soon-2025-cadillac-ct5": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HSihTrJIuzyQNZLV.jpg",
  "coming-soon-2025-chevrolet-corvette": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/faKDxkiMisdITZZK.jpg",
  "coming-soon-2025-bmw-m4": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/pfOUEbweQSeNSqOq.jpg",
  "coming-soon-2025-mercedes-benz-amg-gt": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ipZJeCzyOwtyhKfX.jpg",
  "coming-soon-2025-porsche-911": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/JhTqjeQjzUiSqYma.jpg",
  "coming-soon-2025-mercedes-benz-sprinter": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/sJlJvrmTEnSZZVDN.jpg",
};

const modelVehicleVisuals: Record<string, string> = {
  "coming-soon-2021-nissan-altima": "/manus-storage/2021-nissan-altima_b3b2b777.jpg",
  "coming-soon-2022-toyota-camry-xse": "/manus-storage/2022-toyota-camry-xse_a7e49121.jpg",
  "coming-soon-2025-honda-accord": "/manus-storage/2025-honda-accord_7fe6d4f6.jpg",
  "coming-soon-2025-hyundai-sonata": "/manus-storage/2025-hyundai-sonata_01204ff2.jpg",
  "coming-soon-2025-kia-k5": "/manus-storage/2025-kia-k5_0c5a4ca1.jpg",
  "coming-soon-2025-toyota-rav4": "/manus-storage/2025-toyota-rav4_a85d9b43.jpg",
  "coming-soon-2025-honda-cr-v": "/manus-storage/2025-honda-cr-v_fdc930dc.jpg",
  "coming-soon-2025-hyundai-tucson": "/manus-storage/2025-hyundai-tucson_80a930e3.jpg",
  "coming-soon-2025-kia-sportage": "/manus-storage/2025-kia-sportage_84d33b4a.jpg",
  "coming-soon-2025-mazda-cx-5": "/manus-storage/2025-mazda-cx-5_bc6f7a1b.jpg",
  "coming-soon-2025-ford-explorer": "/manus-storage/2025-ford-explorer_fd19d992.jpg",
  "coming-soon-2025-jeep-grand-cherokee": "/manus-storage/2025-jeep-grand-cherokee_557ae2f0.jpg",
  "coming-soon-2025-toyota-highlander": "/manus-storage/2025-toyota-highlander_c157c028.jpg",
  "coming-soon-2025-honda-pilot": "/manus-storage/2025-honda-pilot_00793b59.jpg",
  "coming-soon-2025-tesla-model-y": "/manus-storage/2025-tesla-model-y_f6326d2e.jpg",
  "coming-soon-2025-ford-mustang-mach-e": "/manus-storage/2025-ford-mustang-mach-e_db5d78b7.jpg",
  "coming-soon-2025-hyundai-ioniq-5": "/manus-storage/2025-hyundai-ioniq-5_449c28c1.jpg",
  "coming-soon-2025-kia-ev6": "/manus-storage/2025-kia-ev6_0c74cc35.jpg",
  "coming-soon-2025-chevrolet-blazer-ev": "/manus-storage/2025-chevrolet-blazer-ev_09409007.jpg",
  "coming-soon-2025-nissan-ariya": "/manus-storage/2025-nissan-ariya_284269fd.jpg",
  "coming-soon-2025-ford-f150": "/manus-storage/2025-ford-f150_9088c56f.jpg",
  "coming-soon-2025-chevrolet-silverado-1500": "/manus-storage/2025-chevrolet-silverado-1500_75cb3efb.jpg",
  "coming-soon-2025-ram-1500": "/manus-storage/2025-ram-1500_eb74f4d3.jpg",
  "coming-soon-2025-toyota-tacoma": "/manus-storage/2025-toyota-tacoma_d385e478.jpg",
  "coming-soon-2025-ford-maverick": "/manus-storage/2025-ford-maverick_75d3fdf4.jpg",
  "coming-soon-2025-ford-mustang": "/manus-storage/2025-ford-mustang_86adc37b.jpg",
  "coming-soon-2025-toyota-sienna": "/manus-storage/2025-toyota-sienna_f114e452.jpg",
  "coming-soon-2025-honda-odyssey": "/manus-storage/2025-honda-odyssey_93749f54.jpg",
  "coming-soon-2025-kia-carnival": "/manus-storage/2025-kia-carnival_696f39d0.jpg",
  "coming-soon-2025-chrysler-pacifica": "/manus-storage/2025-chrysler-pacifica_6ec38acf.jpg",
  "coming-soon-2025-ford-transit": "/manus-storage/2025-ford-transit_e2f1abf8.jpg",
  "coming-soon-2025-ram-promaster": "/manus-storage/2025-ram-promaster_da55dc04.jpg",
  "coming-soon-2025-chevrolet-express": "/manus-storage/2025-chevrolet-express_469aa235.jpg",
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
    image: modelVehicleVisuals[id] ?? (access === "elite" ? eliteVehicleVisuals[id] ?? categoryVisuals[type] : categoryVisuals[type]),
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
