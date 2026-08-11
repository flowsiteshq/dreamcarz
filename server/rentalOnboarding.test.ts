import { describe, expect, it } from "vitest";
import {
  IDENTITY_VERIFICATION_STATUSES,
  RENTAL_APPLICATION_STATUSES,
  RENTAL_ONBOARDING_REQUIREMENTS,
  RENTAL_ONBOARDING_STEPS,
  isAllowedRentalApplicationTransition,
} from "../shared/rentalOnboarding";

describe("rental onboarding contract", () => {
  it("defines the five steps in the member-facing rental journey", () => {
    expect(RENTAL_ONBOARDING_STEPS.map(step => step.id)).toEqual([
      "welcome",
      "driving",
      "identity",
      "preferences",
      "review",
    ]);
    expect(RENTAL_ONBOARDING_STEPS.map(step => step.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it("requires license-front and live-selfie identity documents", () => {
    expect(RENTAL_ONBOARDING_REQUIREMENTS.requiredDocuments).toEqual([
      "license_front",
      "live_selfie",
    ]);
    expect(RENTAL_ONBOARDING_REQUIREMENTS.acceptedImageTypes).toContain("image/jpeg");
    expect(RENTAL_ONBOARDING_REQUIREMENTS.maxDocumentBytes).toBe(6 * 1024 * 1024);
  });

  it("permits the review lifecycle but blocks an unsafe direct approval", () => {
    expect(isAllowedRentalApplicationTransition("not_started", "in_progress")).toBe(true);
    expect(isAllowedRentalApplicationTransition("in_progress", "under_review")).toBe(true);
    expect(isAllowedRentalApplicationTransition("under_review", "approved")).toBe(true);
    expect(isAllowedRentalApplicationTransition("not_started", "approved")).toBe(false);
  });

  it("keeps application and identity status vocabularies explicit", () => {
    expect(RENTAL_APPLICATION_STATUSES).toContain("needs_attention");
    expect(IDENTITY_VERIFICATION_STATUSES).toContain("manual_review");
  });
});
