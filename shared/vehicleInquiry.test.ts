import { describe, expect, it } from "vitest";
import { hasCompleteRentalInquiry, vehicleInquiryReferencePrefix } from "./vehicleInquiry";

describe("vehicle inquiry rules", () => {
  it("accepts a complete rental inquiry with valid dates and a pickup location", () => {
    expect(hasCompleteRentalInquiry({
      requestedStartDate: "2026-09-01",
      requestedEndDate: "2026-09-07",
      pickupLocation: "Lanham, MD",
    })).toBe(true);
  });

  it("rejects incomplete or invalid rental timing", () => {
    expect(hasCompleteRentalInquiry({
      requestedStartDate: "2026-09-07",
      requestedEndDate: "2026-09-01",
      pickupLocation: "Lanham, MD",
    })).toBe(false);
    expect(hasCompleteRentalInquiry({
      requestedStartDate: "2026-09-01",
      requestedEndDate: "2026-09-07",
      pickupLocation: " ",
    })).toBe(false);
  });

  it("keeps rental and purchase references distinct", () => {
    expect(vehicleInquiryReferencePrefix("rental")).toBe("VR");
    expect(vehicleInquiryReferencePrefix("purchase")).toBe("VP");
    expect(vehicleInquiryReferencePrefix("reserve")).toBe("VS");
  });
});
