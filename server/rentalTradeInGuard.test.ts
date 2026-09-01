import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isTransactionStep, nextCustomerTransactionStep } from "../shared/transactionLifecycle";

const panel = readFileSync(resolve(import.meta.dirname, "../client/src/components/ConciergeEnrollmentPanel.tsx"), "utf8");
const router = readFileSync(resolve(import.meta.dirname, "./routers.ts"), "utf8");

describe("rental trade-in separation", () => {
  it("does not permit trade-in in the rental customer-step lifecycle", () => {
    expect(isTransactionStep("rental", "trade_in")).toBe(false);
    expect(nextCustomerTransactionStep("rental", "identity")).toBe("eligibility");
  });

  it("renders trade-in controls only for a purchase and safely recovers an invalid legacy rental step", () => {
    expect(panel).toContain('transaction.currentStep === "trade_in" && transaction.transactionType === "purchase"');
    expect(panel).toContain('transaction.currentStep === "trade_in" && transaction.transactionType !== "purchase"');
    expect(router).toContain('recoverLegacyRentalTradeIn');
    expect(router).toContain('rental.invalid_trade_in_step_recovered');
  });
});
