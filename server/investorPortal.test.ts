import { describe, expect, it } from "vitest";
import { calculateInvestorProjection, formatAllocation, INVESTOR_TARGET_RAISE_CENTS } from "./investorPortal";

describe("investor planning projections", () => {
  it("calculates a transparent allocation from the stated target raise", () => {
    const projection = calculateInvestorProjection({ contributionCents: 500_000, targetRaiseCents: INVESTOR_TARGET_RAISE_CENTS, monthlyDistributableProfitCents: 1_250_000 });
    expect(projection.allocationBps).toBe(200);
    expect(formatAllocation(projection.allocationBps)).toBe("2%");
    expect(projection.estimatedMonthlyDistributionCents).toBe(25_000);
  });

  it("withholds payout illustration when there is no published profit figure", () => {
    const projection = calculateInvestorProjection({ contributionCents: 250_000, targetRaiseCents: INVESTOR_TARGET_RAISE_CENTS, monthlyDistributableProfitCents: null });
    expect(projection.allocationBps).toBe(100);
    expect(projection.estimatedMonthlyDistributionCents).toBeNull();
  });

  it("rejects invalid projection inputs", () => {
    expect(() => calculateInvestorProjection({ contributionCents: -1, targetRaiseCents: INVESTOR_TARGET_RAISE_CENTS, monthlyDistributableProfitCents: null })).toThrow("non-negative");
  });
});
