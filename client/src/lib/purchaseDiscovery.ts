export const PURCHASE_VEHICLE_TYPES = [
  "suv",
  "sedan",
  "truck",
  "sports_luxury",
  "ev_hybrid",
  "not_sure",
] as const;

export type PurchaseVehicleType = (typeof PURCHASE_VEHICLE_TYPES)[number];
export type PurchaseCondition = "new" | "used" | "either" | null;
export type PurchaseDrivingStyle = "sporty" | "comfort" | "practical" | null;
export type PurchasePositioning = "premium" | "value" | null;
export type PurchasePrimaryUse = "family" | "commuting" | "work" | "weekends" | null;
export type PurchaseBudgetMethod = "purchase_price" | "monthly_payment" | "either" | null;
export type PurchaseTradeIn = "yes" | "no" | null;
export type PurchaseTimeline = "now" | "soon" | "exploring" | null;
export type PurchaseJourneyState = "discovery" | "searching" | "results" | "vehicle_selected" | "purchase" | "complete";

/**
 * A session-scoped record of a buyer's stated requirements. It deliberately
 * contains preferences, not an application, finance request, or PII.
 */
export type ShopperProfile = {
  intent: "buy";
  bodyStyle: PurchaseVehicleType | null;
  condition: PurchaseCondition;
  preferredMakes: string[];
  preferredModels: string[];
  drivingStyle: PurchaseDrivingStyle;
  positioning: PurchasePositioning;
  primaryUse: PurchasePrimaryUse;
  passengerRequirement: number | null;
  cargoRequirement: "light" | "high" | null;
  mustHaveFeatures: string[];
  preferredColor: string | null;
  budgetMethod: PurchaseBudgetMethod;
  maxPurchasePrice: number | null;
  targetMonthlyPayment: number | null;
  downPayment: number | null;
  tradeIn: PurchaseTradeIn;
  maxMileage: number | null;
  location: string | null;
  purchaseTimeline: PurchaseTimeline;
};

export type PurchaseInventoryVehicle = {
  vehicleId: string;
  vehicleName: string;
  vehicleClass: "sedan" | "suv";
  image: string;
  /** Optional confirmed fields. Undefined means the public inventory record does not verify it. */
  confirmed?: {
    condition?: Exclude<PurchaseCondition, null>;
    purchasePrice?: number;
    mileage?: number;
    seatingCapacity?: number;
    color?: string;
    features?: string[];
    make?: string;
    model?: string;
  };
};

export type ShopperProfileField = keyof ShopperProfile;
export type ShopperProfileExtraction = {
  profile: ShopperProfile;
  changedFields: ShopperProfileField[];
};

export type PurchaseQuickAction = { label: string; message: string };
export type PurchaseQuestion = {
  field: "body_style" | "budget_method" | "max_purchase_price" | "target_monthly_payment" | "priority" | "primary_use" | "condition";
  prompt: string;
  quickActions: PurchaseQuickAction[];
};

export type RankedPurchaseMatch = {
  vehicle: PurchaseInventoryVehicle;
  score: number | null;
  category: "Best match" | "Alternative";
  reasons: string[];
  tradeoffs: string[];
  verifiedCriteria: number;
  verifiableCriteria: number;
};

export const emptyShopperProfile = (): ShopperProfile => ({
  intent: "buy",
  bodyStyle: null,
  condition: null,
  preferredMakes: [],
  preferredModels: [],
  drivingStyle: null,
  positioning: null,
  primaryUse: null,
  passengerRequirement: null,
  cargoRequirement: null,
  mustHaveFeatures: [],
  preferredColor: null,
  budgetMethod: null,
  maxPurchasePrice: null,
  targetMonthlyPayment: null,
  downPayment: null,
  tradeIn: null,
  maxMileage: null,
  location: null,
  purchaseTimeline: null,
});

/** Backwards-compatible alias for the previous Concierge helper. */
export const emptyPurchaseDiscovery = emptyShopperProfile;
export type PurchaseDiscovery = ShopperProfile;

const colors = ["black", "white", "gray", "grey", "silver", "red", "blue", "green", "brown", "tan", "beige"] as const;
const featurePatterns: Array<[string, RegExp]> = [
  ["Apple CarPlay", /\b(?:apple\s+carplay|carplay)\b/i],
  ["Android Auto", /\bandroid\s+auto\b/i],
  ["AWD", /\b(?:all[-\s]?wheel\s+drive|awd)\b/i],
  ["third-row seating", /\b(?:third[-\s]?row|3rd[-\s]?row)\b/i],
  ["leather seating", /\bleather\b/i],
  ["sunroof", /\b(?:sunroof|moonroof)\b/i],
  ["heated seats", /\bheated\s+seats?\b/i],
  ["backup camera", /\b(?:backup|rear)\s+camera\b/i],
];
const knownMakes = ["Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chevy", "Chrysler", "Dodge", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes", "Nissan", "Porsche", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"];

const normalizeColor = (value: string) => value === "grey" ? "gray" : value;
const moneyValue = (raw: string, suffix?: string) => {
  const numeric = Number(raw.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return suffix?.toLowerCase() === "k" ? numeric * 1_000 : numeric;
};
const latestMatch = (value: string, expression: RegExp) => {
  const matches = Array.from(value.matchAll(expression));
  return matches.at(-1) ?? null;
};
const appendUnique = (values: string[], additions: string[]) => Array.from(new Set([...values, ...additions]));

function latestBodyStyle(value: string): PurchaseVehicleType | null {
  const choices: Array<[PurchaseVehicleType, RegExp]> = [
    ["suv", /\b(?:suv|crossover)\b/gi],
    ["sedan", /\b(?:sedan|saloon)\b/gi],
    ["truck", /\b(?:truck|pickup)\b/gi],
    ["sports_luxury", /\b(?:sports?\s+car|coupe|convertible)\b/gi],
    ["ev_hybrid", /\b(?:ev|electric|hybrid|plug[-\s]?in)\b/gi],
    ["not_sure", /\b(?:not\s+sure|no\s+preference|anything\s+works)\b/gi],
  ];
  const matches = choices.flatMap(([kind, expression]) => Array.from(value.matchAll(expression)).map(match => ({ kind, index: match.index ?? -1 })));
  return matches.sort((a, b) => a.index - b.index).at(-1)?.kind ?? null;
}

export function detectPurchaseVehicleType(text: string): PurchaseVehicleType | null {
  return latestBodyStyle(text.toLowerCase());
}

export function extractShopperProfile(message: string, current: ShopperProfile): ShopperProfileExtraction {
  const value = message.trim();
  const lower = value.toLowerCase();
  const next: ShopperProfile = { ...current };
  const changedFields: ShopperProfileField[] = [];
  const update = <K extends ShopperProfileField>(field: K, fieldValue: ShopperProfile[K]) => {
    if (JSON.stringify(next[field]) === JSON.stringify(fieldValue)) return;
    (next[field] as ShopperProfile[K]) = fieldValue;
    changedFields.push(field);
  };

  const bodyStyle = latestBodyStyle(lower);
  if (bodyStyle) update("bodyStyle", bodyStyle);

  if (/\b(?:not\s+new|pre[-\s]?owned|used)\b/i.test(value)) update("condition", "used");
  else if (/\b(?:new|brand\s+new)\b/i.test(value)) update("condition", "new");
  else if (/\b(?:either|both|open\s+to\s+(?:both|anything))\b/i.test(value)) update("condition", "either");

  if (/\b(?:premium|luxury|upscale|high[-\s]?end)\b/i.test(value)) update("positioning", "premium");
  else if (/\b(?:value|affordable|budget[-\s]?friendly|low\s+payment)\b/i.test(value)) update("positioning", "value");

  if (/\b(?:fun|responsive|sporty|performance|engaging|quick)\b/i.test(value)) update("drivingStyle", "sporty");
  else if (/\b(?:quiet|comfortable|comfort|smooth|relaxed)\b/i.test(value)) update("drivingStyle", "comfort");
  else if (/\b(?:practical|reliable|reliability|dependable)\b/i.test(value)) update("drivingStyle", "practical");

  if (/\b(?:family|kids?|children|passengers?)\b/i.test(value)) update("primaryUse", "family");
  else if (/\b(?:commut(?:e|ing)|daily\s+(?:drive|driving)|everyday\s+driving)\b/i.test(value)) update("primaryUse", "commuting");
  else if (/\b(?:work|cargo|haul|business|equipment)\b/i.test(value)) update("primaryUse", "work");
  else if (/\b(?:weekend|road\s*trip|lifestyle|leisure)\b/i.test(value)) update("primaryUse", "weekends");

  if (/\b(?:cargo|haul|equipment|work\s+gear)\b/i.test(value)) update("cargoRequirement", "high");
  else if (/\b(?:light\s+packing|minimal\s+cargo)\b/i.test(value)) update("cargoRequirement", "light");
  const passengers = latestMatch(value, /\b(?:family\s+of|for)\s+(\d{1,2})\b|\b(\d{1,2})\s+(?:passengers?|people|seats?)\b/gi);
  const passengerText = passengers?.[1] || passengers?.[2];
  if (passengerText) {
    const count = Number(passengerText);
    if (Number.isInteger(count) && count >= 1 && count <= 15) update("passengerRequirement", count);
  }

  const color = latestMatch(lower, new RegExp(`\\b(?:prefer(?:ably)?|want|like|in|anything|show(?:\s+me)?|available)\\s+(${colors.join("|")})\\b`, "gi"))?.[1]
    ?? latestMatch(lower, new RegExp(`\\b(?:anything|show(?:\s+me)?|available)\\s+in\\s+(${colors.join("|")})\\b`, "gi"))?.[1]
    ?? latestMatch(lower, new RegExp(`\\b(${colors.join("|")})\\s+(?:one|vehicle|car|suv|sedan)\\b`, "gi"))?.[1];
  if (color) update("preferredColor", normalizeColor(color.toLowerCase()));

  const features = featurePatterns.filter(([, expression]) => expression.test(value)).map(([feature]) => feature);
  if (features.length) update("mustHaveFeatures", appendUnique(next.mustHaveFeatures, features));

  const purchasePrice = Array.from(value.matchAll(/\b(?:under|below|up\s+to|max(?:imum)?(?:\s+(?:price|budget))?|less\s+than|budget(?:\s+of)?|around)\s*\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b/gi)).filter(match => {
    const nearby = value.slice(Math.max(0, (match.index ?? 0) - 16), (match.index ?? 0) + match[0].length + 20);
    return !/\b(?:month|monthly|\/mo|per\s+month|miles?)\b/i.test(nearby);
  }).at(-1);
  if (purchasePrice) {
    const parsed = moneyValue(purchasePrice[1], purchasePrice[2]);
    if (parsed && parsed >= 1_000) {
      update("maxPurchasePrice", parsed);
      if (next.budgetMethod === null || next.budgetMethod === "either") update("budgetMethod", "purchase_price");
    }
  }
  const monthly = latestMatch(value, /\b(?:under|below|up\s+to|max(?:imum)?|around)\s*\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\s*(?:\/?mo\.?|per\s+month|a\s+month|monthly)\b/gi)
    ?? latestMatch(value, /\b(?:monthly\s+(?:payment|budget)\s+(?:of|under|below)?\s*)\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b/gi);
  if (monthly) {
    const parsed = moneyValue(monthly[1], monthly[2]);
    if (parsed && parsed > 0) {
      update("targetMonthlyPayment", parsed);
      if (next.budgetMethod === null || next.budgetMethod === "either") update("budgetMethod", "monthly_payment");
    }
  }
  if (/\b(?:total\s+(?:price|cost)|purchase\s+price|overall\s+price)\b/i.test(value)) update("budgetMethod", "purchase_price");
  else if (/\b(?:monthly\s+(?:payment|budget)|per\s+month|\/mo)\b/i.test(value)) update("budgetMethod", "monthly_payment");
  else if (/\b(?:both\s+(?:price|payment)|show\s+me\s+both)\b/i.test(value)) update("budgetMethod", "either");

  // A customer can refine an active search without starting over. Preserve the
  // selected budget view while clearing only the amount that no longer fits.
  if (/\b(?:too\s+expensive|cheaper|less\s+expensive|lower\s+(?:the\s+)?(?:price|payment|budget)|smaller\s+(?:price|payment|budget))\b/i.test(value)) {
    if (next.budgetMethod === "monthly_payment") update("targetMonthlyPayment", null);
    else update("maxPurchasePrice", null);
  }

  const downPayment = latestMatch(value, /\b(?:down\s+payment|put(?:ting)?\s+down)\s*(?:of)?\s*\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b/gi);
  if (downPayment) {
    const parsed = moneyValue(downPayment[1], downPayment[2]);
    if (parsed && parsed > 0) update("downPayment", parsed);
  }
  const mileage = latestMatch(value, /\b(?:under|below|up\s+to|max(?:imum)?|less\s+than)\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\s*miles?\b/gi);
  if (mileage) {
    const parsed = moneyValue(mileage[1], mileage[2]);
    if (parsed && parsed > 0) update("maxMileage", parsed);
  }

  if (/\b(?:trade[-\s]?in|trade\s+my)\b/i.test(value)) update("tradeIn", /\b(?:no|without|don['’]t)\b/i.test(value) ? "no" : "yes");
  else if (/\bno\s+trade[-\s]?in\b/i.test(value)) update("tradeIn", "no");

  if (/\b(?:this\s+week|right\s+away|asap|immediately|today)\b/i.test(value)) update("purchaseTimeline", "now");
  else if (/\b(?:next\s+(?:few\s+)?(?:weeks?|month)|soon)\b/i.test(value)) update("purchaseTimeline", "soon");
  else if (/\b(?:just\s+looking|exploring|researching)\b/i.test(value)) update("purchaseTimeline", "exploring");

  const makes = knownMakes.filter(make => new RegExp(`\\b${make.replace(" ", "\\s+")}\\b`, "i").test(value)).map(make => make === "Chevy" ? "Chevrolet" : make);
  if (makes.length) update("preferredMakes", appendUnique(next.preferredMakes, makes));
  const modelMention = latestMatch(value, /\b(?:model\s+([A-Za-z0-9-]+)|([A-Z][A-Za-z0-9-]+)\s+(?:X[0-9]|CX-[0-9]|Q[0-9]|GL[ACE]|Model\s+[3SXY]))\b/g);
  const model = modelMention?.[1] || modelMention?.[2];
  if (model) update("preferredModels", appendUnique(next.preferredModels, [model]));

  return { profile: next, changedFields };
}

export const profileMeaningfulCriteriaCount = (profile: ShopperProfile) => [
  profile.bodyStyle,
  profile.condition,
  profile.positioning,
  profile.drivingStyle,
  profile.primaryUse,
  profile.passengerRequirement,
  profile.cargoRequirement,
  profile.preferredColor,
  profile.maxMileage,
  profile.mustHaveFeatures.length ? "features" : null,
  profile.maxPurchasePrice ?? profile.targetMonthlyPayment,
].filter(Boolean).length;

export const hasActualBudget = (profile: ShopperProfile) => profile.maxPurchasePrice !== null || profile.targetMonthlyPayment !== null;

export function profileReadyForInitialResults(profile: ShopperProfile) {
  return Boolean(profile.bodyStyle && hasActualBudget(profile) && profileMeaningfulCriteriaCount(profile) >= 3);
}

export function nextBestPurchaseQuestion(profile: ShopperProfile): PurchaseQuestion | null {
  if (!profile.bodyStyle) return {
    field: "body_style",
    prompt: "What kind of vehicle should I focus on — an SUV, sedan, truck, something sporty, or an EV/hybrid?",
    quickActions: [
      { label: "SUV", message: "I want an SUV." },
      { label: "Sedan", message: "I want a sedan." },
      { label: "Truck", message: "I need a truck." },
      { label: "Sporty / luxury", message: "I want something sporty or luxurious." },
      { label: "EV / hybrid", message: "I want an EV or hybrid." },
      { label: "Help me decide", message: "I’m not sure yet." },
    ],
  };
  if (profile.budgetMethod === "purchase_price" && profile.maxPurchasePrice === null) return {
    field: "max_purchase_price",
    prompt: "Absolutely. What price range would you like me to stay within?",
    quickActions: [
      { label: "Under $20k", message: "I want to stay under $20,000." },
      { label: "$20k–$30k", message: "I want to stay under $30,000." },
      { label: "$30k–$40k", message: "I want to stay under $40,000." },
      { label: "$40k–$50k", message: "I want to stay under $50,000." },
      { label: "$50k+", message: "My budget is above $50,000." },
      { label: "Not sure", message: "I’m not sure about the price yet." },
    ],
  };
  if (profile.budgetMethod === "monthly_payment" && profile.targetMonthlyPayment === null) return {
    field: "target_monthly_payment",
    prompt: "What monthly payment range feels comfortable for you?",
    quickActions: [
      { label: "Under $400/mo", message: "I want to stay under $400 per month." },
      { label: "$400–$600/mo", message: "I want to stay under $600 per month." },
      { label: "$600–$800/mo", message: "I want to stay under $800 per month." },
      { label: "$800+/mo", message: "I can consider more than $800 per month." },
      { label: "Not sure", message: "I’m not sure about the monthly payment yet." },
    ],
  };
  if (!hasActualBudget(profile)) return {
    field: "budget_method",
    prompt: "Would you rather narrow this by total vehicle price or by a comfortable monthly payment?",
    quickActions: [
      { label: "Total price", message: "I’d rather shop by total vehicle price." },
      { label: "Monthly payment", message: "I’d rather shop by monthly payment." },
      { label: "Compare both", message: "Show me both the total price and a monthly payment scenario." },
      { label: "Not sure", message: "I’m not sure which budget view to use yet." },
    ],
  };
  if (profileMeaningfulCriteriaCount(profile) >= 3) return null;
  if (!profile.positioning && !profile.drivingStyle) return {
    field: "priority",
    prompt: `What matters most in your ${profile.bodyStyle === "suv" ? "SUV" : "next vehicle"}: premium comfort, a fun drive, reliability, fuel savings, more room, or value?`,
    quickActions: [
      { label: "Premium feel", message: "I want something premium and comfortable." },
      { label: "Fun to drive", message: "I want something fun and responsive to drive." },
      { label: "Reliability", message: "I want a dependable everyday vehicle." },
      { label: "Fuel economy", message: "Fuel efficiency matters most." },
      { label: "More room", message: "I need more room for people and gear." },
      { label: "Value", message: "I want the best value for my budget." },
    ],
  };
  if (!profile.primaryUse) return {
    field: "primary_use",
    prompt: "What will you mainly use it for?",
    quickActions: [
      { label: "Family", message: "It will mainly be for family and passengers." },
      { label: "Commuting", message: "It will mainly be for commuting and everyday driving." },
      { label: "Work / cargo", message: "It will mainly be for work or cargo." },
      { label: "Weekends", message: "It will mainly be for weekends and lifestyle driving." },
      { label: "Not sure", message: "I’m not sure yet." },
    ],
  };
  if (!profile.condition) return {
    field: "condition",
    prompt: "Are you leaning toward new, pre-owned, or open to either?",
    quickActions: [
      { label: "New", message: "I’d like new." },
      { label: "Pre-owned", message: "I’m open to a pre-owned vehicle." },
      { label: "Either", message: "I’m open to either new or pre-owned." },
    ],
  };
  return null;
}

export function describeShopperProfile(profile: ShopperProfile) {
  const parts: string[] = [];
  if (profile.condition === "used") parts.push("pre-owned");
  else if (profile.condition === "new") parts.push("new");
  if (profile.positioning === "premium") parts.push("premium");
  if (profile.positioning === "value") parts.push("value-focused");
  if (profile.bodyStyle && profile.bodyStyle !== "not_sure") parts.push(profile.bodyStyle === "sports_luxury" ? "sporty/luxury vehicle" : profile.bodyStyle.toUpperCase());
  if (profile.maxPurchasePrice) parts.push(`under ${formatMoney(profile.maxPurchasePrice)}`);
  else if (profile.targetMonthlyPayment) parts.push(`around ${formatMoney(profile.targetMonthlyPayment)} per month`);
  if (profile.preferredColor) parts.push(`preferably ${profile.preferredColor}`);
  if (profile.maxMileage) parts.push(`under ${formatNumber(profile.maxMileage)} miles`);
  if (profile.drivingStyle === "sporty") parts.push("with an engaging driving feel");
  else if (profile.drivingStyle === "comfort") parts.push("with a comfort-first feel");
  if (profile.primaryUse === "work") parts.push("with room for work or cargo");
  else if (profile.primaryUse === "family") parts.push("with room for family and passengers");
  return parts.length ? parts.join(", ") : "your vehicle preferences";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}
function formatNumber(value: number) { return new Intl.NumberFormat("en-US").format(value); }

function requiredFeaturesSatisfied(vehicle: PurchaseInventoryVehicle, features: string[]) {
  if (!features.length) return { satisfied: true, verifiable: 0, matched: 0 };
  if (!vehicle.confirmed?.features) return { satisfied: true, verifiable: 0, matched: 0 };
  const knownFeatures = vehicle.confirmed.features.map(feature => feature.toLowerCase());
  const matched = features.filter(feature => knownFeatures.includes(feature.toLowerCase())).length;
  return { satisfied: matched === features.length, verifiable: features.length, matched };
}

export function rankPurchaseInventory(vehicles: readonly PurchaseInventoryVehicle[], profile: ShopperProfile): RankedPurchaseMatch[] {
  const candidates = vehicles.filter(vehicle => {
    if (profile.bodyStyle === "suv" || profile.bodyStyle === "sedan") return vehicle.vehicleClass === profile.bodyStyle;
    return true;
  }).filter(vehicle => {
    const confirmed = vehicle.confirmed;
    if (profile.maxPurchasePrice !== null && confirmed?.purchasePrice !== undefined && confirmed.purchasePrice > profile.maxPurchasePrice) return false;
    if (profile.maxMileage !== null && confirmed?.mileage !== undefined && confirmed.mileage > profile.maxMileage) return false;
    if (profile.condition && profile.condition !== "either" && confirmed?.condition && confirmed.condition !== profile.condition) return false;
    if (profile.passengerRequirement !== null && confirmed?.seatingCapacity !== undefined && confirmed.seatingCapacity < profile.passengerRequirement) return false;
    return requiredFeaturesSatisfied(vehicle, profile.mustHaveFeatures).satisfied;
  });

  return candidates.map(vehicle => {
    const confirmed = vehicle.confirmed;
    const reasons: string[] = [];
    const tradeoffs: string[] = [];
    let matched = 0;
    let verifiable = 0;

    if (profile.bodyStyle === vehicle.vehicleClass) { reasons.push(`Confirmed ${vehicle.vehicleClass.toUpperCase()} category matches your requested body style.`); matched += 1; verifiable += 1; }
    if (profile.maxPurchasePrice !== null) {
      if (confirmed?.purchasePrice !== undefined) { verifiable += 1; if (confirmed.purchasePrice <= profile.maxPurchasePrice) { matched += 1; reasons.push("Confirmed price is within your stated range."); } }
      else tradeoffs.push("Price needs verification.");
    }
    if (profile.maxMileage !== null) {
      if (confirmed?.mileage !== undefined) { verifiable += 1; if (confirmed.mileage <= profile.maxMileage) { matched += 1; reasons.push("Confirmed mileage meets your preference."); } }
      else tradeoffs.push("Mileage needs verification.");
    }
    if (profile.condition && profile.condition !== "either") {
      if (confirmed?.condition) { verifiable += 1; if (confirmed.condition === profile.condition) { matched += 1; reasons.push("Confirmed condition matches your preference."); } }
      else tradeoffs.push("Condition needs verification.");
    }
    if (profile.preferredColor) {
      if (confirmed?.color) { verifiable += 1; if (confirmed.color.toLowerCase() === profile.preferredColor) { matched += 1; reasons.push("Confirmed color matches your preference."); } }
      else tradeoffs.push("Color needs verification.");
    }
    const featureCheck = requiredFeaturesSatisfied(vehicle, profile.mustHaveFeatures);
    if (featureCheck.verifiable) { verifiable += featureCheck.verifiable; matched += featureCheck.matched; if (featureCheck.matched === featureCheck.verifiable) reasons.push("Confirmed features meet your requirements."); }
    else if (profile.mustHaveFeatures.length) tradeoffs.push("Requested features need verification.");

    if (!reasons.length) reasons.push("Confirmed DreamCarz inventory record available for review.");
    if (!tradeoffs.length && (!confirmed || Object.keys(confirmed).length < 3)) tradeoffs.push("Live vehicle details need verification before a purchase decision.");
    const score = verifiable >= 2 ? Math.round((matched / verifiable) * 100) : null;
    return { vehicle, score, category: "Alternative" as const, reasons, tradeoffs, verifiedCriteria: matched, verifiableCriteria: verifiable };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.verifiedCriteria - a.verifiedCriteria || a.vehicle.vehicleName.localeCompare(b.vehicle.vehicleName)).map((match, index) => ({ ...match, category: index === 0 ? "Best match" : "Alternative" as const }));
}

/** Backwards-compatible rendering helper; strict matching is now in rankPurchaseInventory. */
export function matchingPurchaseInventory(vehicles: readonly PurchaseInventoryVehicle[], profile: ShopperProfile) {
  return rankPurchaseInventory(vehicles, profile).map(match => match.vehicle);
}

export function purchaseMatchLabel(vehicle: PurchaseInventoryVehicle, profile: ShopperProfile) {
  const ranked = rankPurchaseInventory([vehicle], profile)[0];
  return ranked?.score !== null ? `${ranked.score}% verified match` : ranked?.category ?? "Review match";
}

export function determinePurchaseJourneyState(profile: ShopperProfile): Exclude<PurchaseJourneyState, "vehicle_selected" | "purchase" | "complete"> {
  return profileReadyForInitialResults(profile) ? "results" : "discovery";
}

export function advancePurchaseConversation(message: string, current: ShopperProfile) {
  const extraction = extractShopperProfile(message, current);
  const journeyState = determinePurchaseJourneyState(extraction.profile);
  return {
    ...extraction,
    journeyState,
    nextQuestion: journeyState === "discovery" ? nextBestPurchaseQuestion(extraction.profile) : null,
  };
}

export function isPurchaseIntent(text: string) {
  return /\b(?:buy|purchase|own|finance|financing|car\s+shopping)\b/i.test(text);
}
