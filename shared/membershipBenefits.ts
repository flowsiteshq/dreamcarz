export type ActiveMembershipBenefit = {
  benefitType: string;
  label: string;
  configuration: string;
};

export type MembershipBenefitEffects = {
  allowedVehicleIds: string[] | null;
  rentalDiscountCents: number;
  depositAdjustmentCents: number;
  rentalCreditCents: number;
  deliveryCreditCents: number;
  upgradePriority: boolean;
  appliedBenefits: Array<{ benefitType: string; label: string }>;
};

const emptyEffects = (): MembershipBenefitEffects => ({
  allowedVehicleIds: null,
  rentalDiscountCents: 0,
  depositAdjustmentCents: 0,
  rentalCreditCents: 0,
  deliveryCreditCents: 0,
  upgradePriority: false,
  appliedBenefits: [],
});

function parseConfiguration(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function positiveWholeCents(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 10_000_000 ? value : 0;
}

export function evaluateActiveMembershipBenefits(benefits: ActiveMembershipBenefit[]): MembershipBenefitEffects {
  const effects = emptyEffects();
  const allowedVehicleIds = new Set<string>();
  let hasExplicitVehicleAccess = false;

  for (const benefit of benefits) {
    const configuration = parseConfiguration(benefit.configuration);
    if (!configuration) continue;
    effects.appliedBenefits.push({ benefitType: benefit.benefitType, label: benefit.label });

    if (benefit.benefitType === "vehicle_access" && Array.isArray(configuration.vehicleIds)) {
      const validIds = configuration.vehicleIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      if (validIds.length > 0) {
        hasExplicitVehicleAccess = true;
        validIds.forEach(value => allowedVehicleIds.add(value));
      }
    }
    if (benefit.benefitType === "rental_discount") effects.rentalDiscountCents += positiveWholeCents(configuration.amountCents);
    if (benefit.benefitType === "deposit_adjustment") effects.depositAdjustmentCents += positiveWholeCents(configuration.amountCents);
    if (benefit.benefitType === "rental_credit") effects.rentalCreditCents += positiveWholeCents(configuration.amountCents);
    if (benefit.benefitType === "delivery_credit") effects.deliveryCreditCents += positiveWholeCents(configuration.amountCents);
    if (benefit.benefitType === "upgrade_priority" && configuration.enabled === true) effects.upgradePriority = true;
  }

  effects.allowedVehicleIds = hasExplicitVehicleAccess ? Array.from(allowedVehicleIds) : null;
  return effects;
}

export function membershipAllowsVehicle(effects: MembershipBenefitEffects, vehicleId: string) {
  return effects.allowedVehicleIds === null || effects.allowedVehicleIds.includes(vehicleId);
}
