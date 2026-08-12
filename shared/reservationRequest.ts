export const RESERVATION_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "confirmed",
  "change_requested",
  "canceled",
  "declined",
] as const;

export type ReservationRequestStatus = (typeof RESERVATION_REQUEST_STATUSES)[number];

export function hasValidReservationDateRange(startDate: string, endDate: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && endDate >= startDate;
}

export function canMemberCancelReservation(status: ReservationRequestStatus) {
  return ["submitted", "under_review", "change_requested"].includes(status);
}
