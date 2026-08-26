import { hasValidReservationDateRange } from "./reservationRequest";

export type VehicleInquiryType = "rental" | "purchase";

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
  return type === "rental" ? "VR" : "VP";
}
