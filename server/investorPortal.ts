export const INVESTOR_TARGET_RAISE_CENTS = 25_000_000;

export type InvestorProjection = {
  contributionCents: number;
  targetRaiseCents: number;
  monthlyDistributableProfitCents: number | null;
};

export function calculateInvestorProjection({ contributionCents, targetRaiseCents, monthlyDistributableProfitCents }: InvestorProjection) {
  if (contributionCents < 0 || targetRaiseCents <= 0) {
    throw new Error("Investor projection inputs must be non-negative and use a positive target raise.");
  }
  const allocationBps = Math.round((contributionCents / targetRaiseCents) * 10_000);
  const estimatedMonthlyDistributionCents = monthlyDistributableProfitCents === null
    ? null
    : Math.round(monthlyDistributableProfitCents * (allocationBps / 10_000));

  return {
    allocationBps,
    estimatedMonthlyDistributionCents,
  };
}

export function formatAllocation(allocationBps: number) {
  return `${(allocationBps / 100).toFixed(allocationBps % 100 === 0 ? 0 : 2)}%`;
}
