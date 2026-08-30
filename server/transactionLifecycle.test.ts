import { describe, expect, it } from "vitest";
import {
  APPROVED_TRANSACTION_VEHICLES,
  canTransitionTransaction,
  canReuseProfileVerification,
  CUSTOMER_PROFILE_REVERIFICATION_RULES,
  hasVehicleReleaseReadiness,
  getTransactionSteps,
  initialTransactionLifecycle,
  isApprovedTransactionVehicle,
  isTransactionStep,
  nextCustomerTransactionStep,
  transactionStepForStatus,
} from "../shared/transactionLifecycle";

describe("transaction lifecycle contract", () => {
  it("allows transactional onboarding only for the eight confirmed inventory vehicles", () => {
    expect(Object.keys(APPROVED_TRANSACTION_VEHICLES)).toHaveLength(8);
    expect(isApprovedTransactionVehicle("2024-chevrolet-malibu-gray")).toBe(true);
    expect(isApprovedTransactionVehicle("coming-soon-2024-tesla-model-3")).toBe(false);
  });

  it("keeps rental active use and purchase delivery as distinct lifecycle states", () => {
    const rental = initialTransactionLifecycle("rental");
    const purchase = initialTransactionLifecycle("purchase");
    expect(rental.activeRentalStatus).toBe("pending");
    expect(rental.deliveryStatus).toBe("not_applicable");
    expect(purchase.activeRentalStatus).toBe("not_applicable");
    expect(purchase.deliveryStatus).toBe("pending");
  });

  it("uses separate transaction paths for rental and purchase", () => {
    expect(getTransactionSteps("rental")).toContain("settlement");
    expect(getTransactionSteps("rental")).toContain("active_rental");
    expect(getTransactionSteps("purchase")).toContain("trade_in");
    expect(getTransactionSteps("purchase")).toContain("delivery");
    expect(isTransactionStep("purchase", "active_rental")).toBe(false);
  });

  it("documents that reusable profile data does not replace consent or transaction-specific review", () => {
    expect(CUSTOMER_PROFILE_REVERIFICATION_RULES.join(" ")).toContain("withdrawn identity or biometric consent");
    expect(CUSTOMER_PROFILE_REVERIFICATION_RULES.join(" ")).toContain("transaction-specific");
  });

  it("requires current verification and active consent before reusing identity or license status", () => {
    const now = new Date("2026-08-29T12:00:00.000Z");
    expect(canReuseProfileVerification({
      identityStatus: "verified",
      licenseStatus: "verified",
      verificationExpiresAt: new Date("2026-09-29T12:00:00.000Z"),
      hasWithdrawnConsent: false,
      now,
    })).toBe(true);
    expect(canReuseProfileVerification({
      identityStatus: "verified",
      licenseStatus: "verified",
      verificationExpiresAt: new Date("2026-08-28T12:00:00.000Z"),
      hasWithdrawnConsent: false,
      now,
    })).toBe(false);
    expect(canReuseProfileVerification({
      identityStatus: "verified",
      licenseStatus: "verified",
      verificationExpiresAt: new Date("2026-09-29T12:00:00.000Z"),
      hasWithdrawnConsent: true,
      now,
    })).toBe(false);
  });

  it("permits only ordered transaction lifecycle transitions and never releases a vehicle from an incomplete profile", () => {
    expect(canTransitionTransaction("profile_incomplete", "ready_for_pickup")).toBe(false);
    expect(canTransitionTransaction("verification_pending", "eligibility_review")).toBe(true);
    expect(canTransitionTransaction("agreement_pending", "ready_for_pickup")).toBe(true);
    expect(canTransitionTransaction("completed", "active_rental")).toBe(false);
  });

  it("maps lifecycle transitions to the correct rental or purchase customer step", () => {
    expect(transactionStepForStatus("rental", "ready_for_pickup", "agreement")).toBe("pickup");
    expect(transactionStepForStatus("rental", "active_rental", "pickup")).toBe("active_rental");
    expect(transactionStepForStatus("rental", "return_pending", "active_rental")).toBe("return");
    expect(transactionStepForStatus("rental", "settlement_pending", "return")).toBe("settlement");
    expect(transactionStepForStatus("purchase", "completed", "agreement")).toBe("delivery");
  });

  it("keeps customer progression ordered while routing purchase finance paths separately", () => {
    expect(nextCustomerTransactionStep("rental", "profile")).toBe("contact_verification");
    expect(nextCustomerTransactionStep("purchase", "profile")).toBe("identity");
    expect(nextCustomerTransactionStep("rental", "identity")).toBe("eligibility");
    expect(nextCustomerTransactionStep("rental", "insurance")).toBe("additional_drivers");
    expect(nextCustomerTransactionStep("rental", "pricing")).toBe("payment");
    expect(nextCustomerTransactionStep("rental", "payment")).toBe("review");
    expect(nextCustomerTransactionStep("purchase", "trade_in")).toBe("payment_path");
    expect(nextCustomerTransactionStep("purchase", "payment_path", "cash")).toBe("down_payment");
    expect(nextCustomerTransactionStep("purchase", "payment_path", "finance")).toBe("financing");
    expect(nextCustomerTransactionStep("purchase", "agreement")).toBeNull();
  });

  it("requires every operational verification before a vehicle can be released", () => {
    const ready = { identityStatus: "verified", licenseStatus: "verified", eligibilityStatus: "cleared", insuranceStatus: "verified", paymentStatus: "authorized", agreementStatus: "signed" };
    expect(hasVehicleReleaseReadiness(ready)).toBe(true);
    expect(hasVehicleReleaseReadiness({ ...ready, paymentStatus: "pending" })).toBe(false);
    expect(hasVehicleReleaseReadiness({ ...ready, agreementStatus: "awaiting_signature" })).toBe(false);
  });
});
