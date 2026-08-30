export const DREAMCARZ_LEDGER_REFERENCE_PREFIX = "DCW";

export const DREAMCARZ_MEMBERSHIP_BENEFIT_TYPES = [
  "vehicle_access",
  "rental_discount",
  "deposit_adjustment",
  "rental_credit",
  "delivery_credit",
  "upgrade_priority",
  "partner_benefit",
  "other",
] as const;

export const DREAMCARZ_WALLET_ENTRY_TYPES = [
  "credit",
  "debit",
  "deposit_hold",
  "deposit_release",
  "refund",
  "promotion",
  "membership_credit",
  "referral_credit",
  "adjustment",
] as const;

export type WalletLedgerEntryLike = {
  amountCents: number;
  entryType: "credit" | "debit" | "deposit_hold" | "deposit_release" | "refund" | "promotion" | "membership_credit" | "referral_credit" | "adjustment";
  status: "pending" | "posted" | "reversed" | "voided";
};

/**
 * The displayed balance includes only posted credits and debits. Deposit holds
 * are reported independently so a hold cannot be mistaken for spendable credit.
 */
export function summarizeWalletLedger(entries: WalletLedgerEntryLike[]) {
  return entries.reduce(
    (summary, entry) => {
      if (entry.status !== "posted") return summary;
      if (["credit", "refund", "promotion", "membership_credit", "referral_credit"].includes(entry.entryType)) {
        summary.availableCreditCents += entry.amountCents;
      }
      if (["debit", "adjustment"].includes(entry.entryType)) {
        summary.availableCreditCents -= entry.amountCents;
      }
      if (entry.entryType === "deposit_hold") summary.activeHoldCents += entry.amountCents;
      if (entry.entryType === "deposit_release") summary.activeHoldCents -= entry.amountCents;
      return summary;
    },
    { availableCreditCents: 0, activeHoldCents: 0 },
  );
}
