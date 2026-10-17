/** DreamCarz pricing configuration draft. No charges are created by this module. */
export const MEMBERSHIP_SETUP_FEES_CENTS = {
  essential: 98800,
  plus: 178800,
  premier: 348800,
} as const;

export type MembershipTier = keyof typeof MEMBERSHIP_SETUP_FEES_CENTS;
export type BillingPeriod = "biweekly" | "monthly";

export function quoteInitialRental(input: {
  tier: MembershipTier;
  dailyRateCents: number;
  billingPeriod: BillingPeriod;
  insuranceDailyCents?: number;
}) {
  if (!Number.isSafeInteger(input.dailyRateCents) || input.dailyRateCents < 0) throw new Error("Invalid daily rate");
  const insuranceDailyCents = input.insuranceDailyCents ?? 0;
  if (!Number.isSafeInteger(insuranceDailyCents) || insuranceDailyCents < 0) throw new Error("Invalid insurance rate");
  const days = input.billingPeriod === "biweekly" ? 14 : 30;
  const setupFeeCents = MEMBERSHIP_SETUP_FEES_CENTS[input.tier];
  if (setupFeeCents === undefined) throw new Error("Invalid membership tier");
  const rentalCents = input.dailyRateCents * days;
  const insuranceCents = insuranceDailyCents * days;
  return { days, setupFeeCents, rentalCents, insuranceCents, subtotalCents: setupFeeCents + rentalCents + insuranceCents };
}
