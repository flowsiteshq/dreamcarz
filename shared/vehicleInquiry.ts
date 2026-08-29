import { hasValidReservationDateRange } from "./reservationRequest";

export type VehicleInquiryType = "rental" | "purchase" | "reserve";

export function hasCompleteRentalInquiry(input: {
  requestedStartDate?: string;
  requestedEndDate?: string;
  pickupLocation?: string;
}) {
  return Boolean(
    input.requestedStartDate &&
      input.requestedEndDate &&
      input.pickupLocation?.trim() &&
      hasValidReservationDateRange(input.requestedStartDate, input.requestedEndDate),
  );
}

export function vehicleInquiryReferencePrefix(type: VehicleInquiryType) {
  if (type === "rental") return "VR";
  if (type === "purchase") return "VP";
  return "VS";
}
