import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { and, eq, inArray, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { staffSmsNotifications } from "../drizzle/schema";

export type StaffAlertEventType = "marketing_opt_in" | "associate_opt_in" | "associate_enrollment_activated";

type StaffAlertProvider = "zapier_email" | "gmail_tmobile_gateway";

type StaffAlertDeliveryConfig = {
  provider: StaffAlertProvider;
  enabled: boolean;
  ready: boolean;
  recipient: string | null;
  recipientHash: string;
  hookUrl: string | null;
  smtpUser: string | null;
  smtpAppPassword: string | null;
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
const T_MOBILE_GATEWAY_DOMAIN = "tmomail.net";

function nonEmptyEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

/** Accept only digits-to-tmomail.net recipients from a server-only Railway value. */
function parseTMobileGatewayRecipients(value: string | null) {
  if (!value) return [];
  const addresses = value.split(",").map(entry => entry.trim().toLowerCase()).filter(Boolean);
  const valid = addresses.filter(address => /^\d{10}@tmomail\.net$/.test(address));
  return Array.from(new Set(valid));
}

function getStaffAlertDeliveryConfigs(): StaffAlertDeliveryConfig[] {
  const emailEnabled = process.env.STAFF_EMAIL_ALERTS_ENABLED === "true";
  const hookUrl = validatedZapierHookUrl(nonEmptyEnv("STAFF_EMAIL_ZAPIER_HOOK_URL"));
  const emailConfig: StaffAlertDeliveryConfig = {
    provider: "zapier_email",
    enabled: emailEnabled,
    ready: emailEnabled && Boolean(hookUrl),
    recipient: null,
    recipientHash: stableHash(ZAPIER_EMAIL_RECIPIENT_KEY),
    hookUrl,
    smtpUser: null,
    smtpAppPassword: null,
  };

  const smsEnabled = process.env.STAFF_SMS_EMAIL_GATEWAY_ENABLED === "true";
  const smtpUser = nonEmptyEnv("STAFF_SMS_SMTP_USER");
  const smtpAppPassword = nonEmptyEnv("STAFF_SMS_SMTP_APP_PASSWORD");
  const smsRecipients = parseTMobileGatewayRecipients(nonEmptyEnv("STAFF_SMS_T_MOBILE_GATEWAYS"));
  const smsConfigs: StaffAlertDeliveryConfig[] = smsRecipients.map(recipient => ({
    provider: "gmail_tmobile_gateway" as const,
    enabled: smsEnabled,
    ready: smsEnabled && Boolean(smtpUser && smtpAppPassword),
    recipient,
    recipientHash: stableHash(`gmail-tmobile:${recipient}`),
    hookUrl: null,
    smtpUser,
    smtpAppPassword,
  }));

  // Retain a disabled outbox record when direct SMS is enabled but no valid
  // recipient is configured. This surfaces readiness without storing a number.
  if (smsEnabled && smsConfigs.length === 0) {
    smsConfigs.push({
      provider: "gmail_tmobile_gateway",
      enabled: true,
      ready: false,
      recipient: null,
      recipientHash: stableHash("gmail-tmobile-unconfigured"),
      hookUrl: null,
      smtpUser,
      smtpAppPassword,
    });
  }

  return [emailConfig, ...smsConfigs];
}

function deliveryKey(input: StaffAlertQueueInput, config: StaffAlertDeliveryConfig) {
  return `${input.eventType}:${input.sourceRecordType}:${input.sourceRecordId}:${config.provider}:${config.recipientHash.slice(0, 32)}`;
}

function retryDelayMs(attempts: number) {
  return Math.min(5 * 60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60_000);
}

function safeMessage(input: StaffAlertQueueInput) {
  return input.message.trim().slice(0, MESSAGE_MAX_LENGTH);
}

/**
 * Queues staff-only operational alerts. Zapier continues to deliver the full
 * email; the optional Gmail route sends only a short plain-text copy to each
 * configured T-Mobile email-to-text address. Customer contact details, payment
 * data, tokens, answers, and credentials are never placed in either payload.
 */
export async function queueStaffOperationalAlert(input: StaffAlertQueueInput) {
  const db = await getDb();
  if (!db) return { queued: 0, status: "database_unavailable" as const };

  const message = safeMessage(input);
  if (!message) return { queued: 0, status: "invalid_message" as const };

  const configs = getStaffAlertDeliveryConfigs();
  const enabledConfigs = configs.filter(config => config.enabled);
  const targets = enabledConfigs.length > 0 ? enabledConfigs : [{
    provider: "zapier_email" as const,
    enabled: false,
    ready: false,
    recipient: null,
    recipientHash: stableHash(ZAPIER_EMAIL_RECIPIENT_KEY),
    hookUrl: null,
    smtpUser: null,
    smtpAppPassword: null,
  }];

  let queued = 0;
  for (const config of targets) {
    const key = deliveryKey(input, config);
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
        recipientHash: config.recipientHash,
        status: config.ready ? "pending" : "disabled",
        message,
        nextAttemptAt: config.ready ? new Date() : null,
      });
      queued += 1;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (code !== "ER_DUP_ENTRY") throw error;
    }
  }

  if (targets.some(config => config.ready) && queued > 0) await processDueStaffOperationalAlerts(10);
  return { queued, status: targets.some(config => config.ready) ? "queued" as const : "disabled" as const };
}

async function markDisabled(notificationId: number, code: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffSmsNotifications).set({ status: "disabled", nextAttemptAt: null, lastErrorCode: code }).where(eq(staffSmsNotifications.id, notificationId));
}

async function sendViaZapierEmail(notification: typeof staffSmsNotifications.$inferSelect, config: StaffAlertDeliveryConfig) {
  if (!config.hookUrl) throw new Error("staff_email_alert_not_configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
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
    if (!response.ok) throw new Error(`zapier_hook_http_${response.status}`);
    return "zapier_email_hook";
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaGmailTMobileGateway(notification: typeof staffSmsNotifications.$inferSelect, config: StaffAlertDeliveryConfig) {
  if (!config.recipient || !config.smtpUser || !config.smtpAppPassword) throw new Error("staff_sms_email_gateway_not_configured");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.smtpUser, pass: config.smtpAppPassword },
  });
  const result = await transporter.sendMail({
    from: `DreamCarz Alerts <${config.smtpUser}>`,
    to: config.recipient,
    subject: "DreamCarz alert",
    text: notification.message,
  });
  return result.messageId?.slice(0, 191) || "gmail_tmobile_gateway";
}

async function sendQueuedStaffOperationalAlert(notification: typeof staffSmsNotifications.$inferSelect) {
  const db = await getDb();
  if (!db) return { status: "database_unavailable" as const };

  const config = getStaffAlertDeliveryConfigs().find(entry => entry.recipientHash === notification.recipientHash);
  if (!config || !config.ready) {
    await markDisabled(notification.id, config?.provider === "gmail_tmobile_gateway" ? "staff_sms_email_gateway_not_configured" : "staff_email_alert_not_configured");
    return { status: "disabled" as const };
  }

  const claimed = await db.update(staffSmsNotifications).set({ status: "sending", lastErrorCode: null })
    .where(and(eq(staffSmsNotifications.id, notification.id), inArray(staffSmsNotifications.status, ["pending", "retry_scheduled"])));
  const affectedRows = Number((claimed as Array<{ affectedRows?: number | bigint }>)[0]?.affectedRows ?? 0);
  if (affectedRows !== 1) return { status: "skipped" as const };

  const nextAttempts = notification.attempts + 1;
  try {
    const providerMessageSid = config.provider === "gmail_tmobile_gateway"
      ? await sendViaGmailTMobileGateway(notification, config)
      : await sendViaZapierEmail(notification, config);
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
    const errorCode = error instanceof Error && /^(zapier_hook_http_\d+|staff_(email_alert|sms_email_gateway)_not_configured)$/.test(error.message)
      ? error.message
      : config.provider === "gmail_tmobile_gateway" ? "staff_sms_email_gateway_delivery_failed" : "staff_email_alert_delivery_failed";
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
    const result = await sendQueuedStaffOperationalAlert(notification);
    if (result.status === "sent") sent += 1;
    if (result.status === "retry_scheduled") retryScheduled += 1;
    if (result.status === "failed") failed += 1;
    if (result.status === "disabled") disabled += 1;
  }
  return { processed: due.length, sent, retryScheduled, failed, disabled };
}

export function getStaffOperationalAlertStatus() {
  const configs = getStaffAlertDeliveryConfigs().filter(config => config.enabled);
  return {
    enabled: configs.length > 0,
    ready: configs.some(config => config.ready),
    provider: configs.map(config => config.provider).join("+") || "none",
  };
}
