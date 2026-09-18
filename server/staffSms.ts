import { createHash } from "node:crypto";
import { and, eq, inArray, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { staffSmsNotifications } from "../drizzle/schema";

export type StaffAlertEventType = "marketing_opt_in" | "associate_opt_in" | "associate_enrollment_activated";

type StaffEmailAlertConfig = {
  enabled: boolean;
  ready: boolean;
  hookUrl: string | null;
};

type StaffAlertQueueInput = {
  eventType: StaffAlertEventType;
  sourceRecordType: "marketing_lead" | "advertising_lead" | "associate_lead" | "associate_enrollment";
  sourceRecordId: string | number;
  message: string;
};

const MAX_ATTEMPTS = 6;
const MESSAGE_MAX_LENGTH = 480;
const ZAPIER_EMAIL_RECIPIENT_KEY = "zapier-email-recipient";

function nonEmptyEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function validatedZapierHookUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "hooks.zapier.com" || url.hostname.endsWith(".hooks.zapier.com")) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getStaffEmailAlertConfig(): StaffEmailAlertConfig {
  const enabled = process.env.STAFF_EMAIL_ALERTS_ENABLED === "true";
  const hookUrl = validatedZapierHookUrl(nonEmptyEnv("STAFF_EMAIL_ZAPIER_HOOK_URL"));
  return { enabled, ready: enabled && Boolean(hookUrl), hookUrl };
}

function recipientHash() {
  return createHash("sha256").update(ZAPIER_EMAIL_RECIPIENT_KEY).digest("hex");
}

function deliveryKey(input: StaffAlertQueueInput) {
  return `${input.eventType}:${input.sourceRecordType}:${input.sourceRecordId}:${recipientHash().slice(0, 32)}`;
}

function retryDelayMs(attempts: number) {
  return Math.min(5 * 60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60_000);
}

function safeMessage(input: StaffAlertQueueInput) {
  return input.message.trim().slice(0, MESSAGE_MAX_LENGTH);
}

/**
 * Queues a staff-only operational email alert through a protected server-side
 * Zapier hook. The payload intentionally excludes customer contact details,
 * payment data, tokens, form answers, and other restricted information.
 */
export async function queueStaffOperationalAlert(input: StaffAlertQueueInput) {
  const db = await getDb();
  if (!db) return { queued: 0, status: "database_unavailable" as const };

  const config = getStaffEmailAlertConfig();
  const message = safeMessage(input);
  if (!message) return { queued: 0, status: "invalid_message" as const };

  const key = deliveryKey(input);
  const existing = (await db.select({ id: staffSmsNotifications.id })
    .from(staffSmsNotifications)
    .where(eq(staffSmsNotifications.deliveryKey, key))
    .limit(1))[0];
  if (existing) return { queued: 0, status: "duplicate" as const };

  try {
    await db.insert(staffSmsNotifications).values({
      eventType: input.eventType,
      sourceRecordType: input.sourceRecordType,
      sourceRecordId: String(input.sourceRecordId).slice(0, 160),
      deliveryKey: key,
      recipientHash: recipientHash(),
      status: config.ready ? "pending" : "disabled",
      message,
      nextAttemptAt: config.ready ? new Date() : null,
    });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code === "ER_DUP_ENTRY") return { queued: 0, status: "duplicate" as const };
    throw error;
  }

  if (config.ready) await processDueStaffOperationalAlerts(1);
  return { queued: 1, status: config.ready ? "queued" as const : "disabled" as const };
}

async function sendQueuedStaffOperationalAlert(notification: typeof staffSmsNotifications.$inferSelect, config: StaffEmailAlertConfig) {
  const db = await getDb();
  if (!db) return { status: "database_unavailable" as const };
  if (!config.ready || !config.hookUrl) {
    await db.update(staffSmsNotifications).set({ status: "disabled", nextAttemptAt: null, lastErrorCode: "staff_email_alert_not_configured" }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: "disabled" as const };
  }

  const claimed = await db.update(staffSmsNotifications).set({ status: "sending", lastErrorCode: null })
    .where(and(eq(staffSmsNotifications.id, notification.id), inArray(staffSmsNotifications.status, ["pending", "retry_scheduled"])));
  const affectedRows = Number((claimed as Array<{ affectedRows?: number | bigint }>)[0]?.affectedRows ?? 0);
  if (affectedRows !== 1) return { status: "skipped" as const };

  const nextAttempts = notification.attempts + 1;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(config.hookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: notification.eventType,
        sourceRecordType: notification.sourceRecordType,
        sourceRecordId: notification.sourceRecordId,
        subject: "DreamCarz staff alert",
        message: notification.message,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`zapier_hook_http_${response.status}`);
    await db.update(staffSmsNotifications).set({
      status: "sent",
      attempts: nextAttempts,
      providerMessageSid: "zapier_email_hook",
      sentAt: new Date(),
      nextAttemptAt: null,
      lastErrorCode: null,
    }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: "sent" as const };
  } catch (error) {
    const errorCode = error instanceof Error && /^zapier_hook_http_\d+$/.test(error.message) ? error.message : "staff_email_alert_delivery_failed";
    const exhausted = nextAttempts >= MAX_ATTEMPTS;
    await db.update(staffSmsNotifications).set({
      status: exhausted ? "failed" : "retry_scheduled",
      attempts: nextAttempts,
      nextAttemptAt: exhausted ? null : new Date(Date.now() + retryDelayMs(nextAttempts)),
      lastErrorCode: errorCode,
    }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: exhausted ? "failed" as const : "retry_scheduled" as const };
  }
}

/** Processes a bounded batch in the existing one-shot Railway retry worker. */
export async function processDueStaffOperationalAlerts(limit = 20) {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, retryScheduled: 0, failed: 0, disabled: 0 };
  const config = getStaffEmailAlertConfig();
  const now = new Date();
  const due = await db.select().from(staffSmsNotifications).where(or(
    eq(staffSmsNotifications.status, "pending"),
    and(eq(staffSmsNotifications.status, "retry_scheduled"), lte(staffSmsNotifications.nextAttemptAt, now)),
  )).limit(Math.max(1, Math.min(limit, 50)));

  let sent = 0;
  let retryScheduled = 0;
  let failed = 0;
  let disabled = 0;
  for (const notification of due) {
    const result = await sendQueuedStaffOperationalAlert(notification, config);
    if (result.status === "sent") sent += 1;
    if (result.status === "retry_scheduled") retryScheduled += 1;
    if (result.status === "failed") failed += 1;
    if (result.status === "disabled") disabled += 1;
  }
  return { processed: due.length, sent, retryScheduled, failed, disabled };
}

export function getStaffOperationalAlertStatus() {
  const config = getStaffEmailAlertConfig();
  return { enabled: config.enabled, ready: config.ready, provider: "zapier_email" };
}
