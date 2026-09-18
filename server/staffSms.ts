import { createHash } from "node:crypto";
import { and, eq, inArray, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { staffSmsNotifications } from "../drizzle/schema";

export type StaffSmsEventType = "marketing_opt_in" | "associate_opt_in" | "associate_enrollment_activated";

type StaffSmsConfig = {
  enabled: boolean;
  ready: boolean;
  accountSid: string | null;
  authToken: string | null;
  from: string | null;
  messagingServiceSid: string | null;
  recipients: string[];
};

type StaffSmsQueueInput = {
  eventType: StaffSmsEventType;
  sourceRecordType: "marketing_lead" | "advertising_lead" | "associate_lead" | "associate_enrollment";
  sourceRecordId: string | number;
  message: string;
};

const MAX_ATTEMPTS = 6;
const MESSAGE_MAX_LENGTH = 480;

function nonEmptyEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function normalizedRecipient(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

function getStaffSmsConfig(): StaffSmsConfig {
  const enabled = process.env.STAFF_SMS_NOTIFICATIONS_ENABLED === "true";
  const accountSid = nonEmptyEnv("STAFF_SMS_TWILIO_ACCOUNT_SID");
  const authToken = nonEmptyEnv("STAFF_SMS_TWILIO_AUTH_TOKEN");
  const from = nonEmptyEnv("STAFF_SMS_TWILIO_FROM");
  const messagingServiceSid = nonEmptyEnv("STAFF_SMS_TWILIO_MESSAGING_SERVICE_SID");
  const recipients = Array.from(new Set(
    (process.env.STAFF_SMS_RECIPIENTS ?? "")
      .split(",")
      .map(normalizedRecipient)
      .filter((value): value is string => Boolean(value)),
  ));

  return {
    enabled,
    ready: enabled && Boolean(accountSid && authToken && (from || messagingServiceSid) && recipients.length),
    accountSid,
    authToken,
    from,
    messagingServiceSid,
    recipients,
  };
}

function recipientHash(recipient: string) {
  return createHash("sha256").update(recipient).digest("hex");
}

function deliveryKey(input: StaffSmsQueueInput, recipient: string) {
  return `${input.eventType}:${input.sourceRecordType}:${input.sourceRecordId}:${recipientHash(recipient).slice(0, 32)}`;
}

function retryDelayMs(attempts: number) {
  return Math.min(5 * 60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60_000);
}

function safeMessage(input: StaffSmsQueueInput) {
  return input.message.trim().slice(0, MESSAGE_MAX_LENGTH);
}

/**
 * Queues staff-only operational SMS alerts. Messages intentionally contain no
 * customer contact details, payment data, tokens, or form answers; staff use
 * the protected DreamCarz administration workspace for that information.
 */
export async function queueStaffSmsNotifications(input: StaffSmsQueueInput) {
  const db = await getDb();
  if (!db) return { queued: 0, status: "database_unavailable" as const };

  const config = getStaffSmsConfig();
  if (!config.recipients.length) return { queued: 0, status: "not_configured" as const };
  const message = safeMessage(input);
  if (!message) return { queued: 0, status: "invalid_message" as const };

  let queued = 0;
  for (const recipient of config.recipients) {
    const key = deliveryKey(input, recipient);
    const existing = (await db.select({ id: staffSmsNotifications.id })
      .from(staffSmsNotifications)
      .where(eq(staffSmsNotifications.deliveryKey, key))
      .limit(1))[0];
    if (existing) continue;

    try {
      await db.insert(staffSmsNotifications).values({
        eventType: input.eventType,
        sourceRecordType: input.sourceRecordType,
        sourceRecordId: String(input.sourceRecordId).slice(0, 160),
        deliveryKey: key,
        recipientHash: recipientHash(recipient),
        status: config.ready ? "pending" : "disabled",
        message,
        nextAttemptAt: config.ready ? new Date() : null,
      });
      queued += 1;
    } catch (error) {
      // A concurrent request can create the same unique delivery key first.
      // Treat it as an idempotent duplicate and never send a second text.
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (code !== "ER_DUP_ENTRY") throw error;
    }
  }

  if (config.ready && queued) await processDueStaffSmsNotifications(Math.min(queued, 20));
  return { queued, status: config.ready ? "queued" as const : "disabled" as const };
}

async function sendQueuedStaffSms(notification: typeof staffSmsNotifications.$inferSelect, config: StaffSmsConfig) {
  if (!config.ready || !config.accountSid || !config.authToken) {
    await (await getDb())?.update(staffSmsNotifications).set({ status: "disabled", nextAttemptAt: null, lastErrorCode: "staff_sms_not_configured" }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: "disabled" as const };
  }

  const recipient = config.recipients.find(value => recipientHash(value) === notification.recipientHash);
  if (!recipient) {
    await (await getDb())?.update(staffSmsNotifications).set({ status: "disabled", nextAttemptAt: null, lastErrorCode: "staff_sms_recipient_not_configured" }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: "disabled" as const };
  }

  const db = await getDb();
  if (!db) return { status: "database_unavailable" as const };
  const claimed = await db.update(staffSmsNotifications).set({ status: "sending", lastErrorCode: null })
    .where(and(eq(staffSmsNotifications.id, notification.id), inArray(staffSmsNotifications.status, ["pending", "retry_scheduled"])));
  const affectedRows = Number((claimed as Array<{ affectedRows?: number | bigint }>)[0]?.affectedRows ?? 0);
  if (affectedRows !== 1) return { status: "skipped" as const };

  const form = new URLSearchParams({ To: recipient, Body: notification.message });
  if (config.messagingServiceSid) form.set("MessagingServiceSid", config.messagingServiceSid);
  else if (config.from) form.set("From", config.from);

  const nextAttempts = notification.attempts + 1;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`twilio_http_${response.status}`);
    const payload = await response.json().catch(() => null) as { sid?: unknown } | null;
    const providerMessageSid = typeof payload?.sid === "string" ? payload.sid.slice(0, 160) : null;
    await db.update(staffSmsNotifications).set({
      status: "sent",
      attempts: nextAttempts,
      providerMessageSid,
      sentAt: new Date(),
      nextAttemptAt: null,
      lastErrorCode: null,
    }).where(eq(staffSmsNotifications.id, notification.id));
    return { status: "sent" as const };
  } catch (error) {
    const errorCode = error instanceof Error && /^twilio_http_\d+$/.test(error.message) ? error.message : "staff_sms_delivery_failed";
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

/** Processes a bounded batch for the existing one-shot Railway retry worker. */
export async function processDueStaffSmsNotifications(limit = 20) {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, retryScheduled: 0, failed: 0, disabled: 0 };
  const config = getStaffSmsConfig();
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
    const result = await sendQueuedStaffSms(notification, config);
    if (result.status === "sent") sent += 1;
    if (result.status === "retry_scheduled") retryScheduled += 1;
    if (result.status === "failed") failed += 1;
    if (result.status === "disabled") disabled += 1;
  }
  return { processed: due.length, sent, retryScheduled, failed, disabled };
}

export function getStaffSmsNotificationStatus() {
  const config = getStaffSmsConfig();
  return {
    enabled: config.enabled,
    ready: config.ready,
    recipientCount: config.recipients.length,
    provider: "twilio",
  };
}
