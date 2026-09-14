/**
 * Canonical seed data transcribed from the user-supplied Dream Carz AI + DCP
 * Master Programmer Specification v1.3 (effective 2026-09-11). Runtime code
 * reads the effective configuration from the database; these values exist only
 * to provision and test that versioned configuration.
 */

export const MASTER_PROGRAM_SPECIFICATION = {
  code: "DREAMCARZ_MASTER_2026_09_11",
  version: "1.3",
  effectiveStart: "2026-09-11T00:00:00.000Z",
  sourceLabel: "Dream Carz AI + DCP Master Programmer Specification v1.3",
  faceValueDcpPerDollar: 100,
  standardWalletEarnRatePerEligibleDollar: 10,
} as const;

export const MASTER_MEMBERSHIP_PLAN_SEED = [
  { code: "FREE", name: "Free", enrollmentFeeCents: 0, monthlyFeeCents: 0, startingDcpr: 0, multiplier: 0, vehicleAccess: "Basic eligible rental access", asLowDailyRateCents: 4995, dcpPerDay: 0, walletCodes: [] },
  { code: "FREEDOM", name: "Freedom", enrollmentFeeCents: 24_900, monthlyFeeCents: 4_900, startingDcpr: 15_000, multiplier: 1, vehicleAccess: "$10K–$15K", asLowDailyRateCents: 4495, dcpPerDay: 500, walletCodes: ["DCPR"] },
  { code: "PLUS", name: "Plus", enrollmentFeeCents: 49_900, monthlyFeeCents: 9_900, startingDcpr: 40_000, multiplier: 2, vehicleAccess: "Up to $20K", asLowDailyRateCents: 3995, dcpPerDay: 1_000, walletCodes: ["DCPR", "DCPM"] },
  { code: "PRO", name: "Pro", enrollmentFeeCents: 149_900, monthlyFeeCents: 19_900, startingDcpr: 60_000, multiplier: 3, vehicleAccess: "Up to $30K", asLowDailyRateCents: 3495, dcpPerDay: 1_500, walletCodes: ["DCPR", "DCPM", "DCPO"] },
  { code: "ELITE", name: "Elite", enrollmentFeeCents: 249_900, monthlyFeeCents: 34_900, startingDcpr: 80_000, multiplier: 4, vehicleAccess: "Up to $50K", asLowDailyRateCents: 2995, dcpPerDay: 2_000, walletCodes: ["DCPR", "DCPM", "DCPO", "DCPW"] },
  { code: "SILVER", name: "Silver", enrollmentFeeCents: 499_500, monthlyFeeCents: 49_900, startingDcpr: 100_000, multiplier: 5, vehicleAccess: "Up to $75K", asLowDailyRateCents: 2495, dcpPerDay: 2_500, walletCodes: ["DCPR", "DCPM", "DCPO", "DCPW", "DCPP"] },
  { code: "GOLD", name: "Gold", enrollmentFeeCents: 999_500, monthlyFeeCents: 89_900, startingDcpr: 200_000, multiplier: 6, vehicleAccess: "Up to $100K", asLowDailyRateCents: 1995, dcpPerDay: 3_000, walletCodes: ["DCPR", "DCPM", "DCPO", "DCPW", "DCPP", "DCPF"] },
  { code: "BLACK", name: "Black", enrollmentFeeCents: 2_499_500, monthlyFeeCents: 129_500, startingDcpr: 500_000, multiplier: 7, vehicleAccess: "$100K+", asLowDailyRateCents: 995, dcpPerDay: 4_000, walletCodes: ["DCPR", "DCPO", "DCPW", "DCPP", "DCPF", "DCPE"] },
] as const;

export const MASTER_DCP_WALLET_SEED = [
  { walletCode: "DCPR", walletName: "Rental Savings", minimumTier: "FREEDOM", earnMultiplier: 1, primaryUse: "Reduce eligible rental base charge", redemptionPriority: 1, guardrail: "DCPR is first priority for rental redemption." },
  { walletCode: "DCPM", walletName: "Membership Progress", minimumTier: "PLUS", earnMultiplier: 1, primaryUse: "Eligible membership upgrade or progression value", redemptionPriority: 20, guardrail: "Not used by Black because Black is the top tier." },
  { walletCode: "DCPO", walletName: "Ownership Power", minimumTier: "PRO", earnMultiplier: 1, primaryUse: "Eligible RTO, LTO, or ownership path value", redemptionPriority: 30, guardrail: "Only approved paths; ownership is not guaranteed." },
  { walletCode: "DCPW", walletName: "Worry-Free Power", minimumTier: "ELITE", earnMultiplier: 1, primaryUse: "Eligible protection or Worry-Free benefits", redemptionPriority: 40, guardrail: "Activation, eligibility, and contract limits may apply." },
  { walletCode: "DCPP", walletName: "Payment Power", minimumTier: "SILVER", earnMultiplier: 1, primaryUse: "Eligible lease, subscription, or payment support", redemptionPriority: 50, guardrail: "Subject to agreement, margin, and payment rules." },
  { walletCode: "DCPF", walletName: "Fleet Power", minimumTier: "GOLD", earnMultiplier: 1, primaryUse: "Eligible multi-vehicle, Host, or fleet path", redemptionPriority: 60, guardrail: "Requires approved vehicles, insurance, utilization, and program eligibility." },
  { walletCode: "DCPE", walletName: "Everything DCP™", minimumTier: "BLACK", earnMultiplier: 2, primaryUse: "Flexible use across approved eligible categories", redemptionPriority: 2, guardrail: "Black-only, category-limited, and not cash or unrestricted value." },
] as const;

export type MasterMembershipPlanSeed = (typeof MASTER_MEMBERSHIP_PLAN_SEED)[number];
export type MasterDcpWalletSeed = (typeof MASTER_DCP_WALLET_SEED)[number];

export function formatProgramUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
