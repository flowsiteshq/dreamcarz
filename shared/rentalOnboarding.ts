export const RENTAL_ONBOARDING_STEPS = [
  {
    id: "welcome",
    number: 1,
    title: "Your rental profile",
    description: "Confirm the personal information used to manage your DreamCarz rental account.",
  },
  {
    id: "driving",
    number: 2,
    title: "Driving eligibility",
    description: "Provide your license jurisdiction, expiration date, and driving experience.",
  },
  {
    id: "identity",
    number: 3,
    title: "Identity verification",
    description: "Capture your driver's license and a live selfie for secure verification.",
  },
  {
    id: "preferences",
    number: 4,
    title: "Your driving preferences",
    description: "Tell us the vehicle types and driving experiences you are interested in.",
  },
  {
    id: "review",
    number: 5,
    title: "Review & submit",
    description: "Review your rental application and authorize DreamCarz to process it.",
  },
] as const;

export type RentalOnboardingStepId = (typeof RENTAL_ONBOARDING_STEPS)[number]["id"];

export const RENTAL_APPLICATION_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "needs_attention",
  "declined",
] as const;

export type RentalApplicationStatus = (typeof RENTAL_APPLICATION_STATUSES)[number];

export const RENTAL_APPLICATION_TRANSITIONS: Record<RentalApplicationStatus, RentalApplicationStatus[]> = {
  not_started: ["in_progress"],
  in_progress: ["submitted", "under_review"],
  submitted: ["under_review", "needs_attention", "declined"],
  under_review: ["approved", "needs_attention", "declined"],
  approved: ["needs_attention"],
  needs_attention: ["in_progress", "under_review", "declined"],
  declined: ["in_progress"],
};

export function isAllowedRentalApplicationTransition(
  from: RentalApplicationStatus,
  to: RentalApplicationStatus,
) {
  return RENTAL_APPLICATION_TRANSITIONS[from].includes(to);
}

export const IDENTITY_VERIFICATION_STATUSES = [
  "not_started",
  "documents_uploaded",
  "pending_review",
  "verified",
  "manual_review",
  "failed",
] as const;

export type IdentityVerificationStatus = (typeof IDENTITY_VERIFICATION_STATUSES)[number];

export const RENTAL_DOCUMENT_TYPES = [
  "license_front",
  "license_back",
  "live_selfie",
] as const;

export type RentalDocumentType = (typeof RENTAL_DOCUMENT_TYPES)[number];

export const RENTAL_ONBOARDING_REQUIREMENTS = {
  minimumAge: 21,
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  maxDocumentBytes: 6 * 1024 * 1024,
  requiredDocuments: ["license_front", "live_selfie"] as const,
  requiredConsents: ["identityConsent", "rentalTermsConsent"] as const,
} as const;

export const RENTAL_CONSENT_COPY = {
  identity:
    "I authorize DreamCarz to securely process my driver's license image and live selfie solely to verify my identity and rental eligibility. I understand that identity verification may require manual review.",
  rentalTerms:
    "I confirm that the information in this rental application is accurate and agree to the DreamCarz rental terms, vehicle-use rules, and privacy policy.",
} as const;
