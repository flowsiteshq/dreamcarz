export type LegacyRentalContinuationTransaction = {
  reference: string;
  transactionType: string;
  status: string;
  currentStep: string;
  vehicleName: string;
};

const RESUMABLE_RENTAL_STATUSES = new Set([
  "profile_incomplete",
  "verification_pending",
  "manual_review",
  "eligibility_review",
  "payment_pending",
  "agreement_pending",
]);

/**
 * A legacy rental application is never treated as the same record as a vehicle
 * transaction. This helper selects only an existing account-owned rental
 * transaction the member can open and resume.
 */
export function findLegacyRentalContinuation(transactions: LegacyRentalContinuationTransaction[]) {
  return transactions.find(transaction => transaction.transactionType === "rental" && RESUMABLE_RENTAL_STATUSES.has(transaction.status)) ?? null;
}
