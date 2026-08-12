import { describe, expect, it } from "vitest";
import { canMemberCancelReservation, hasValidReservationDateRange } from "../shared/reservationRequest";

describe("reservation request rules", () => {
  it("accepts same-day and future reservation date ranges", () => {
    expect(hasValidReservationDateRange("2026-08-15", "2026-08-15")).toBe(true);
    expect(hasValidReservationDateRange("2026-08-15", "2026-08-22")).toBe(true);
  });

  it("rejects malformed and reversed reservation date ranges", () => {
    expect(hasValidReservationDateRange("08/15/2026", "2026-08-22")).toBe(false);
    expect(hasValidReservationDateRange("2026-08-22", "2026-08-15")).toBe(false);
  });

  it("allows cancellation only while a request is still actionable", () => {
    expect(canMemberCancelReservation("submitted")).toBe(true);
    expect(canMemberCancelReservation("under_review")).toBe(true);
    expect(canMemberCancelReservation("change_requested")).toBe(true);
    expect(canMemberCancelReservation("confirmed")).toBe(false);
    expect(canMemberCancelReservation("canceled")).toBe(false);
  });
});
