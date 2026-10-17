/** Pure payment notification scheduling; delivery requires verified account data. */
export type PaymentNotice = "three_days_before" | "one_day_before" | "due_today" | "one_day_overdue" | "two_days_overdue" | "three_business_days_overdue";

function dateValue(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Invalid date");
  const time = Date.parse(day + "T00:00:00Z");
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== day) throw new Error("Invalid date");
  return time;
}

export function selectPaymentNotice(dueDate: string, currentDate: string): PaymentNotice | null {
  const due = dateValue(dueDate);
  const current = dateValue(currentDate);
  const days = Math.round((current - due) / 86400000);
  if (days === -3) return "three_days_before";
  if (days === -1) return "one_day_before";
  if (days === 0) return "due_today";
  if (days === 1) return "one_day_overdue";
  if (days === 2) return "two_days_overdue";
  if (days < 1) return null;
  let businessDays = 0;
  for (let time = due + 86400000; time <= current; time += 86400000) {
    const weekday = new Date(time).getUTCDay();
    if (weekday !== 0 && weekday !== 6) businessDays++;
  }
  return businessDays === 3 ? "three_business_days_overdue" : null;
}

export function paymentNoticeKey(transactionId: number, dueDate: string, notice: PaymentNotice) {
  return `payment-notice:${transactionId}:${dueDate}:${notice}`;
}
