import { and, asc, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { dcpWalletDefinitions, masterProgramConfigurations, membershipPlanConfigurations } from "../drizzle/schema";
import { getDb } from "./db";

export type ActiveMasterProgramConfiguration = {
  code: string;
  version: string;
  effectiveStart: Date;
  effectiveEnd: Date | null;
  faceValueDcpPerDollar: number;
  standardWalletEarnRatePerEligibleDollar: number;
  membershipPlans: Array<{
    code: string;
    name: string;
    enrollmentFeeCents: number;
    monthlyFeeCents: number;
    startingDcpr: number;
    multiplier: number;
    vehicleAccess: string;
    asLowDailyRateCents: number;
    dcpPerDay: number;
    walletCodes: string[];
  }>;
  walletDefinitions: Array<{
    walletCode: string;
    walletName: string;
    minimumTier: string;
    earnMultiplier: number;
    primaryUse: string;
    redemptionPriority: number;
    guardrail: string;
  }>;
};

function splitWalletCodes(value: string) {
  return value.split(",").map(code => code.trim()).filter(Boolean);
}

/** Reads only the approved configuration active at the supplied timestamp. */
export async function getActiveMasterProgramConfiguration(now = new Date()): Promise<ActiveMasterProgramConfiguration | null> {
  const db = await getDb();
  if (!db) return null;
  const versions = await db.select().from(masterProgramConfigurations).where(and(
    eq(masterProgramConfigurations.status, "active"),
    lte(masterProgramConfigurations.effectiveStart, now),
    or(isNull(masterProgramConfigurations.effectiveEnd), gt(masterProgramConfigurations.effectiveEnd, now)),
  )).orderBy(desc(masterProgramConfigurations.effectiveStart)).limit(1);
  const version = versions[0];
  if (!version) return null;

  const [plans, wallets] = await Promise.all([
    db.select().from(membershipPlanConfigurations).where(eq(membershipPlanConfigurations.masterProgramConfigurationId, version.id)).orderBy(asc(membershipPlanConfigurations.displayOrder)),
    db.select().from(dcpWalletDefinitions).where(eq(dcpWalletDefinitions.masterProgramConfigurationId, version.id)).orderBy(asc(dcpWalletDefinitions.redemptionPriority)),
  ]);

  return {
    code: version.code,
    version: version.version,
    effectiveStart: version.effectiveStart,
    effectiveEnd: version.effectiveEnd,
    faceValueDcpPerDollar: version.faceValueDcpPerDollar,
    standardWalletEarnRatePerEligibleDollar: version.standardWalletEarnRatePerEligibleDollar,
    membershipPlans: plans.map(plan => ({
      code: plan.planCode,
      name: plan.planName,
      enrollmentFeeCents: plan.enrollmentFeeCents,
      monthlyFeeCents: plan.monthlyFeeCents,
      startingDcpr: plan.startingDcpr,
      multiplier: plan.membershipMultiplier,
      vehicleAccess: plan.vehicleAccessLabel,
      asLowDailyRateCents: plan.asLowDailyRateCents,
      dcpPerDay: plan.dcpPerDay,
      walletCodes: splitWalletCodes(plan.walletCodes),
    })),
    walletDefinitions: wallets.map(wallet => ({
      walletCode: wallet.walletCode,
      walletName: wallet.walletName,
      minimumTier: wallet.minimumTier,
      earnMultiplier: wallet.earnMultiplier,
      primaryUse: wallet.primaryUse,
      redemptionPriority: wallet.redemptionPriority,
      guardrail: wallet.guardrail,
    })),
  };
}
