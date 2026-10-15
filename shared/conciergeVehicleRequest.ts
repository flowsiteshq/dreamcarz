type VehicleClass = "suv" | "sedan" | null;
type ConversationEntry = { role: "member" | "concierge"; text: string };

export function vehicleClassFromText(text: string): VehicleClass {
  // Use the last explicit class when the customer changes their mind.
  const matches = text.toLowerCase().match(/\b(?:suvs?|sedans?)\b/g);
  const last = matches?.[matches.length - 1];
  return last?.startsWith("suv") ? "suv" : last?.startsWith("sedan") ? "sedan" : null;
}

export function resolveConciergeVehicleRequest(
  question: string,
  contextClass: VehicleClass = null,
  conversation: ConversationEntry[] = [],
) {
  const explicitClass = vehicleClassFromText(question);
  const previousClass = [...conversation].reverse()
    .filter(entry => entry.role === "member")
    .map(entry => vehicleClassFromText(entry.text))
    .find(Boolean) ?? null;
  const vehicleClass = explicitClass ?? contextClass ?? previousClass;
  const text = question.trim().toLowerCase().replace(/[?.!]+$/g, "");
  const asksForAll = /\b(?:all|every|entire|full)\b.*\b(?:suvs?|sedans?|vehicles?|cars?|options?|list|inventory)\b|\b(?:suvs?|sedans?)\b.*\b(?:all|every|list|options?)\b/.test(text)
    || /^(?:show\s+(?:me\s+)?)?(?:all|everything|the rest)(?:\s+please)?$/.test(text);
  // Short conversational continuations (including common typing errors) refer
  // to the known vehicle class, not a fresh rental intake.
  const asksForMore = /^(?:(?:do|dont|don't)\s+you\s+(?:have|hav)|(?:have|hav)\s+you\s+got|(?:is|are)\s+there|what\s+else|(?:show|let\s+me\s+see)(?:\s+me)?|(?:can|could)\s+(?:you|i)\s+(?:show|see)(?:\s+me)?|i(?:'d|d)?\s+(?:like|want)\s+to\s+see)?\s*(?:any\s*more|more|others?|other\s+options|anything\s+else|the\s+rest)(?:\s+(?:suvs?|sedans?|vehicles?|cars?|options?|choices))?(?:\s+(?:please|instead))?$/.test(text)
    || /^(?:do\s+you\s+(?:have|hav)\s+)?anything\s+else(?:\s+please)?$/.test(text)
    || /^what\s+else(?:\s+(?:do\s+you\s+(?:have|hav)|is\s+there))?$/.test(text);
  return { explicitClass, vehicleClass, showAll: Boolean((asksForAll || asksForMore) && vehicleClass), asksForMore };
}
