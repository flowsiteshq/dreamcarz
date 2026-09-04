export type ConciergeIntent = "rental" | "purchase" | "membership" | "explore";
export type ConciergeVehicleClass = "sedan" | "suv" | null;
export type ConciergeSecureField = "name" | "email" | "password" | "existingPassword" | null;
export type ConciergeComposerContext = {
  field: ConciergeSecureField;
  askingGeneralQuestion?: boolean;
  selectedVehicleName?: string | null;
  hasActiveReservation?: boolean;
  isMember?: boolean;
};

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

export function conciergeComposerPlaceholder({ field, askingGeneralQuestion = false, selectedVehicleName, hasActiveReservation = false, isMember = false }: ConciergeComposerContext) {
  if (!askingGeneralQuestion && field === "email") return "Enter your email address…";
  if (!askingGeneralQuestion && field === "name") return "Enter your name…";
  if (!askingGeneralQuestion && field === "existingPassword") return "Enter your password…";
  if (!askingGeneralQuestion && field === "password") return "Create a secure password…";
  const vehicleName = selectedVehicleName?.replace(/^\d{4}\s+/, "").replace(/\s*[·-]\s*.+$/, "").trim();
  if (vehicleName) return `Ask about this ${vehicleName}…`;
  if (hasActiveReservation) return "Need help with your reservation?";
  if (isMember) return "Ask DreamCarz anything…";
  return "What car are you looking for?";
}
