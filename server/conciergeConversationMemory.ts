/**
 * DreamCarz concierge conversation memory.
 * Integration helper: wire into the active chat/voice request handler before enabling.
 * No customer PII is persisted by this module.
 */
export type ConciergeRole = "user" | "assistant";
export interface ConciergeMessage { role: ConciergeRole; content: string; }
export interface RentalContext {
  vehiclePreference?: string;
  pickupLocation?: string;
  pickupDate?: string;
  returnDate?: string;
  budget?: string;
}
export interface ConciergeSession {
  id: string;
  messages: ConciergeMessage[];
  rental: RentalContext;
  updatedAt: number;
}
const MAX_MESSAGES = 24;
const SESSION_TTL_MS = 60 * 60 * 1000;
const sessions = new Map<string, ConciergeSession>();

export function getConciergeSession(id: string): ConciergeSession {
  const existing = sessions.get(id);
  if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) return existing;
  const session: ConciergeSession = { id, messages: [], rental: {}, updatedAt: Date.now() };
  sessions.set(id, session);
  return session;
}
export function recordConciergeMessage(id: string, message: ConciergeMessage): ConciergeSession {
  const session = getConciergeSession(id);
  session.messages.push({ role: message.role, content: message.content.slice(0, 4000) });
  session.messages = session.messages.slice(-MAX_MESSAGES);
  session.updatedAt = Date.now();
  return session;
}
export function updateRentalContext(id: string, patch: Partial<RentalContext>): ConciergeSession {
  const session = getConciergeSession(id);
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      if (value === "") delete (session.rental as Record<string, string>)[key];
      else (session.rental as Record<string, string>)[key] = value;
    }
  }
  session.updatedAt = Date.now();
  return session;
}
export function buildConciergeContext(id: string) {
  const session = getConciergeSession(id);
  return {
    summary: Object.entries(session.rental).map(([key, value]) => `${key}: ${value}`).join("\n"),
    messages: [...session.messages],
  };
}
export function purgeExpiredConciergeSessions(): void {
  for (const [id, session] of sessions) {
    if (Date.now() - session.updatedAt >= SESSION_TTL_MS) sessions.delete(id);
  }
}
