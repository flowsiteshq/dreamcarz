export const TRANSACTION_REFERENCE_PREFIX = {
  rental: "DCR",
  purchase: "DCP",
} as const;

export const TRANSACTION_MEMBERSHIP_PLANS = [
  "free",
  "freedom",
  "plus",
  "pro",
  "elite",
  "silver",
  "gold",
  "black",
] as const;

export type TransactionType = keyof typeof TRANSACTION_REFERENCE_PREFIX;
export type TransactionMembershipPlan = (typeof TRANSACTION_MEMBERSHIP_PLANS)[number];

export const RENTAL_TRANSACTION_STEPS = [
  "vehicle",
  "profile",
  "contact_verification",
  "identity",
  "eligibility",
  "insurance",
  "additional_drivers",
  "membership",
  "pricing",
  "payment",
  "review",
  "agreement",
  "confirmation",
  "pickup",
  "active_rental",
  "return",
  "settlement",
] as const;

export const PURCHASE_TRANSACTION_STEPS = [
  "vehicle",
  "profile",
  "identity",
  "trade_in",
  "payment_path",
  "financing",
  "down_payment",
  "insurance",
  "review",
  "agreement",
  "confirmation",
  "delivery",
] as const;

export const CUSTOMER_PROFILE_REVERIFICATION_RULES = [
  "A profile is reused only for the authenticated account that created it.",
  "Identity and driver-license results must be rechecked before a vehicle release when their provider status, expiration, legal requirement, or risk review requires it.",
  "A withdrawn identity or biometric consent stops automated verification and routes the transaction to manual review or cancellation.",
  "Payment authorization, insurance evidence, pricing, agreement version, condition records, pickup, return, and settlement remain transaction-specific.",
] as const;

export const APPROVED_TRANSACTION_VEHICLES = {
  "2024-chevrolet-malibu-gray": {
    vehicleName: "2024 Chevrolet Malibu",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png",
  },
  "2022-chevrolet-traverse-white": {
    vehicleName: "2022 Chevrolet Traverse",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png",
  },
  "2024-ford-fusion-gray": {
    vehicleName: "2024 Ford Fusion",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png",
  },
  "2020-chevrolet-traverse-gray": {
    vehicleName: "2020 Chevrolet Traverse",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mFFrLJBzyJWqricP.png",
  },
  "2019-chevrolet-malibu-black": {
    vehicleName: "2019 Chevrolet Malibu",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/njSpzrWxcQZbiWBb.png",
  },
  "2015-ford-taurus-gray": {
    vehicleName: "2015 Ford Taurus",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BDcxxQLQxENUVvqj.png",
  },
  "2020-chevrolet-equinox-gray": {
    vehicleName: "2020 Chevrolet Equinox",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QuCANehFYgQjJKfm.png",
  },
  "2020-chevrolet-equinox-black": {
    vehicleName: "2020 Chevrolet Equinox",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png",
  },
} as const;

export type ApprovedTransactionVehicleId = keyof typeof APPROVED_TRANSACTION_VEHICLES;

export function isApprovedTransactionVehicle(vehicleId: string): vehicleId is ApprovedTransactionVehicleId {
  return vehicleId in APPROVED_TRANSACTION_VEHICLES;
}

export function getTransactionSteps(transactionType: TransactionType) {
  return transactionType === "rental" ? RENTAL_TRANSACTION_STEPS : PURCHASE_TRANSACTION_STEPS;
}

export function isTransactionStep(transactionType: TransactionType, value: string) {
  return getTransactionSteps(transactionType).includes(value as never);
}

export function canReuseProfileVerification(input: {
  identityStatus?: string | null;
  licenseStatus?: string | null;
  verificationExpiresAt?: Date | null;
  hasWithdrawnConsent: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return input.identityStatus === "verified"
    && input.licenseStatus === "verified"
    && Boolean(input.verificationExpiresAt && input.verificationExpiresAt > now)
    && !input.hasWithdrawnConsent;
}

export function initialTransactionLifecycle(transactionType: TransactionType) {
  return transactionType === "rental"
    ? { status: "profile_incomplete" as const, currentStep: "profile", insuranceStatus: "pending" as const, paymentStatus: "pending" as const, agreementStatus: "draft" as const, pickupStatus: "pending" as const, activeRentalStatus: "pending" as const, returnStatus: "pending" as const, settlementStatus: "pending" as const, deliveryStatus: "not_applicable" as const }
    : { status: "profile_incomplete" as const, currentStep: "profile", insuranceStatus: "pending" as const, paymentStatus: "pending" as const, agreementStatus: "draft" as const, pickupStatus: "not_applicable" as const, activeRentalStatus: "not_applicable" as const, returnStatus: "not_applicable" as const, settlementStatus: "not_applicable" as const, deliveryStatus: "pending" as const };
}
