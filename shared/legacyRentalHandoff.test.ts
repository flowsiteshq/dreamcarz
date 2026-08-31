import { describe, expect, it } from "vitest";
import { findLegacyRentalContinuation } from "./legacyRentalHandoff";

describe("legacy rental application continuation", () => {
  it("selects only a resumable account-owned rental transaction", () => {
    expect(findLegacyRentalContinuation([
      { reference: "DCP-2026-PURCHASE", transactionType: "purchase", status: "profile_incomplete", currentStep: "profile", vehicleName: "2024 Ford Fusion" },
      { reference: "DCR-2026-RESUME", transactionType: "rental", status: "verification_pending", currentStep: "identity", vehicleName: "2022 Chevrolet Traverse" },
    ])).toMatchObject({ reference: "DCR-2026-RESUME" });
  });

  it("does not present a completed or canceled transaction as a continuation", () => {
    expect(findLegacyRentalContinuation([
      { reference: "DCR-2026-COMPLETE", transactionType: "rental", status: "completed", currentStep: "settlement", vehicleName: "2024 Chevrolet Malibu" },
      { reference: "DCR-2026-CANCELED", transactionType: "rental", status: "canceled", currentStep: "profile", vehicleName: "2020 Chevrolet Equinox" },
    ])).toBeNull();
  });
});
