const ADVERTISING_LEAD_HANDOFF_KEY = "dreamcarz-advertising-lead-handoff";

export function saveAdvertisingLeadHandoff(input: { reference: string; firstName: string }) {
  const reference = input.reference.trim().slice(0, 24);
  const firstName = input.firstName.trim().split(/\s+/)[0]?.slice(0, 80) ?? "";
  if (!reference || !firstName) return false;
  sessionStorage.setItem(ADVERTISING_LEAD_HANDOFF_KEY, JSON.stringify({ reference, firstName }));
  return true;
}

export function takeAdvertisingLeadHandoff() {
  const raw = sessionStorage.getItem(ADVERTISING_LEAD_HANDOFF_KEY);
  sessionStorage.removeItem(ADVERTISING_LEAD_HANDOFF_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { reference?: unknown; firstName?: unknown };
    if (typeof parsed.reference !== "string" || typeof parsed.firstName !== "string") return null;
    const reference = parsed.reference.trim().slice(0, 24);
    const firstName = parsed.firstName.trim().split(/\s+/)[0]?.slice(0, 80) ?? "";
    return reference && firstName ? { reference, firstName } : null;
  } catch {
    return null;
  }
}
