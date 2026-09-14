import { and, desc, eq } from "drizzle-orm";
import { vehicleSubscriptionRateCards } from "../drizzle/schema";
import { getDb } from "./db";

export const RATE_NOT_CONFIGURED = "RATE_NOT_CONFIGURED" as const;

export type ActiveSubscriptionRateCard = {
  vehicleId: string;
  membershipPlanCode: string | null;
  termMonths: number;
  monthlyBaseCents: number;
  includedMilesPerMonth: number;
  includedDaysPerMonth: number;
  monthlyDcpCap: number;
  depositCents: number | null;
  coverageConfiguration: string;
  effectiveStart: Date;
  effectiveEnd: Date | null;
};

/**
 * Returns only currently effective, administrator-approved vehicle economics.
 * A missing card deliberately remains RATE_NOT_CONFIGURED rather than falling
 * back to market benchmarks, membership reference rates, or inferred pricing.
 */
export async function getActiveSubscriptionRateCard(vehicleId: string, now = new Date()): Promise<ActiveSubscriptionRateCard | null> {
  const db = await getDb();
  if (!db) return null;
  const cards = await db.select({
    vehicleId: vehicleSubscriptionRateCards.vehicleId,
    membershipPlanCode: vehicleSubscriptionRateCards.membershipPlanCode,
    termMonths: vehicleSubscriptionRateCards.termMonths,
    monthlyBaseCents: vehicleSubscriptionRateCards.monthlyBaseCents,
    includedMilesPerMonth: vehicleSubscriptionRateCards.includedMilesPerMonth,
    includedDaysPerMonth: vehicleSubscriptionRateCards.includedDaysPerMonth,
    monthlyDcpCap: vehicleSubscriptionRateCards.monthlyDcpCap,
    depositCents: vehicleSubscriptionRateCards.depositCents,
    coverageConfiguration: vehicleSubscriptionRateCards.coverageConfiguration,
    effectiveStart: vehicleSubscriptionRateCards.effectiveStart,
    effectiveEnd: vehicleSubscriptionRateCards.effectiveEnd,
  }).from(vehicleSubscriptionRateCards).where(and(
    eq(vehicleSubscriptionRateCards.vehicleId, vehicleId),
    eq(vehicleSubscriptionRateCards.status, "approved"),
  )).orderBy(desc(vehicleSubscriptionRateCards.effectiveStart));

  return cards.find(card => card.effectiveStart <= now && (!card.effectiveEnd || card.effectiveEnd > now)) ?? null;
}
