import { describe, expect, it } from "vitest";
import {
  APPROVED_TRANSACTION_VEHICLES,
  canReuseProfileVerification,
  CUSTOMER_PROFILE_REVERIFICATION_RULES,
  getTransactionSteps,
  initialTransactionLifecycle,
  isApprovedTransactionVehicle,
  isTransactionStep,
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
});
