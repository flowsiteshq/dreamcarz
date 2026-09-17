import crypto from "node:crypto";
import { and, desc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  advertisingLeads,
  customerProfiles,
  marketingLeadActivities,
  marketingLeads,
  metaLeadEvents,
  metaLeadForms,
  metaLeadIntegrations,
  metaLeadRecords,
  metaLeadTestRuns,
  users,
  vehicleInquiries,
} from "../drizzle/schema";

export const META_LEAD_WEBHOOK_PATH = "/api/meta/lead-ads/webhook";
export const META_LEAD_RETRY_PATH = "/api/scheduled/meta-lead-ads-retry";

const MAX_PROCESSING_ATTEMPTS = 7;
const MAX_STORED_META_ANSWER_BYTES = 60_000;

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type MetaLeadField = {
  name?: unknown;
  values?: unknown;
};

type MetaGraphLead = {
  id?: unknown;
  created_time?: unknown;
  ad_id?: unknown;
  form_id?: unknown;
  platform?: unknown;
  field_data?: unknown;
  custom_disclaimer_responses?: unknown;
};

type MetaAttribution = {
  formName: string | null;
  formStatus: string | null;
  campaignId: string | null;
  campaignName: string | null;
  adSetId: string | null;
  adSetName: string | null;
  adId: string | null;
  adName: string | null;
};

export type MetaLeadAdsConfig = {
  enabled: boolean;
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
  pageAccessToken: string;
  pageId: string;
  graphApiVersion: string;
  webhookReady: boolean;
  graphReady: boolean;
};

export class MetaLeadProcessingError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(code);
  }
}

function optionalEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getMetaLeadAdsConfig(env: NodeJS.ProcessEnv = process.env): MetaLeadAdsConfig {
  const enabled = optionalEnv(env.META_LEAD_ADS_ENABLED).toLowerCase() === "true";
  const appId = optionalEnv(env.META_APP_ID);
  const appSecret = optionalEnv(env.META_APP_SECRET);
  const webhookVerifyToken = optionalEnv(env.META_WEBHOOK_VERIFY_TOKEN);
  const pageAccessToken = optionalEnv(env.META_PAGE_ACCESS_TOKEN);
  const pageId = optionalEnv(env.META_PAGE_ID);
  const graphApiVersion = optionalEnv(env.META_GRAPH_API_VERSION) || "v26.0";
  return {
    enabled,
    appId,
    appSecret,
    webhookVerifyToken,
    pageAccessToken,
    pageId,
    graphApiVersion,
    webhookReady: enabled && Boolean(appSecret && webhookVerifyToken && pageId),
    graphReady: enabled && Boolean(pageAccessToken && pageId),
  };
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, maxLength) : null;
}

function safeIdentifier(value: unknown) {
  const identifier = safeText(value, 128);
  return identifier && /^[A-Za-z0-9._-]+$/.test(identifier) ? identifier : null;
}

function safeJsonText(value: unknown) {
  return typeof value === "string" ? value : value === null || value === undefined ? null : String(value);
}

function safeDateFromMetaTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value * 1_000);
  if (typeof value === "string" && /^\d{10}(?:\.\d+)?$/.test(value)) return new Date(Number(value) * 1_000);
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

/** Verifies Meta's documented sha256=<hex> signature against unparsed request bytes. */
export function verifyMetaLeadWebhookSignature(rawBody: Buffer, signatureHeader: string | string[] | undefined, appSecret: string | undefined) {
  if (!appSecret || typeof signatureHeader !== "string") return false;
  const match = /^sha256=([a-fA-F0-9]{64})$/.exec(signatureHeader.trim());
  if (!match) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
  const received = Buffer.from(match[1], "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function verifyMetaLeadWebhookToken(mode: unknown, receivedToken: unknown, expectedToken: string | undefined) {
  if (mode !== "subscribe" || typeof receivedToken !== "string" || !expectedToken) return false;
  return timingSafeTextEqual(receivedToken, expectedToken);
}

export function normalizeMetaLeadEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized && normalized.length <= 320 ? normalized : null;
}

export function normalizeMetaLeadPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  // DreamCarz's current service area uses North American phone records. Retain
  // international values but normalize a leading North American country code.
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function serializeMetaAnswers(value: unknown, fieldName: string) {
  const serialized = JSON.stringify(value ?? []);
  if (Buffer.byteLength(serialized, "utf8") > MAX_STORED_META_ANSWER_BYTES) {
    throw new MetaLeadProcessingError(`${fieldName}_too_large`, false);
  }
  return serialized;
}

function metaFieldList(value: unknown): Array<{ name: string; values: string[] }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: MetaLeadField) => {
    const name = safeText(entry?.name, 160);
    const values = Array.isArray(entry?.values)
      ? entry.values.map(item => safeJsonText(item)).filter((item): item is string => item !== null)
      : [];
    return name ? [{ name, values }] : [];
  });
}

function firstAnswer(fields: Array<{ name: string; values: string[] }>, names: string[]) {
  const found = fields.find(field => names.includes(field.name.toLowerCase()));
  return found?.values.find(value => value.trim().length > 0)?.trim() ?? null;
}

function mappedInterest(fields: Array<{ name: string; values: string[] }>) {
  const explicit = firstAnswer(fields, ["interest", "interest_type", "vehicle_interest", "service_interest", "intent", "rent_buy_membership"]);
  if (explicit) return explicit.slice(0, 160);
  const vocabulary = /\b(rent(?:al)?|buy|purchase|membership)\b/i;
  const matched = fields.flatMap(field => field.values).find(value => vocabulary.test(value));
  return matched?.slice(0, 160) ?? null;
}

export function mapMetaLeadFields(fieldData: unknown) {
  const fields = metaFieldList(fieldData);
  const nameFromParts = [firstAnswer(fields, ["first_name"]), firstAnswer(fields, ["last_name"])].filter(Boolean).join(" ");
  const fullName = firstAnswer(fields, ["full_name", "name"]) ?? (nameFromParts || null);
  const email = firstAnswer(fields, ["email", "work_email"]);
  const phone = firstAnswer(fields, ["phone_number", "phone", "user_provided_phone_number", "work_phone_number", "whatsapp_number"]);
  return {
    contactName: fullName ? fullName.slice(0, 160) : null,
    contactEmail: email ? email.slice(0, 320) : null,
    contactPhone: phone ? phone.slice(0, 48) : null,
    normalizedEmail: normalizeMetaLeadEmail(email),
    normalizedPhone: normalizeMetaLeadPhone(phone),
    interest: mappedInterest(fields),
  };
}

export function parseMetaLeadWebhookPayload(payload: unknown) {
  const body = payload as { object?: unknown; entry?: unknown };
  if (body?.object !== "page" || !Array.isArray(body.entry)) return [];
  const results = new Map<string, { metaLeadId: string; pageId: string; metaFormId: string | null; metaAdSetId: string | null; metaAdId: string | null; providerCreatedAt: Date | null; entryTime: Date | null }>();
  for (const entry of body.entry) {
    const pageEntry = entry as { id?: unknown; time?: unknown; changes?: unknown };
    const entryPageId = safeIdentifier(pageEntry.id);
    if (!Array.isArray(pageEntry.changes)) continue;
    for (const change of pageEntry.changes) {
      const notification = change as { field?: unknown; value?: unknown };
      if (notification.field !== "leadgen") continue;
      const value = notification.value as { leadgen_id?: unknown; page_id?: unknown; form_id?: unknown; adgroup_id?: unknown; ad_id?: unknown; created_time?: unknown };
      const metaLeadId = safeIdentifier(value?.leadgen_id);
      const pageId = safeIdentifier(value?.page_id) ?? entryPageId;
      if (!metaLeadId || !pageId) continue;
      const parsedEvent = {
        metaLeadId,
        pageId,
        metaFormId: safeIdentifier(value.form_id),
        metaAdSetId: safeIdentifier(value.adgroup_id),
        metaAdId: safeIdentifier(value.ad_id),
        providerCreatedAt: safeDateFromMetaTimestamp(value.created_time),
        entryTime: safeDateFromMetaTimestamp(pageEntry.time),
      };
      const prior = results.get(metaLeadId);
      results.set(metaLeadId, prior ? {
        ...prior,
        metaFormId: prior.metaFormId ?? parsedEvent.metaFormId,
        metaAdSetId: prior.metaAdSetId ?? parsedEvent.metaAdSetId,
        metaAdId: prior.metaAdId ?? parsedEvent.metaAdId,
        providerCreatedAt: prior.providerCreatedAt ?? parsedEvent.providerCreatedAt,
        entryTime: prior.entryTime ?? parsedEvent.entryTime,
      } : parsedEvent);
    }
  }
  return Array.from(results.values());
}

function isDuplicateKeyError(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  return code === "ER_DUP_ENTRY" || code === 1062 || /duplicate/i.test(error instanceof Error ? error.message : "");
}

async function findOrCreateIntegration(db: Database, pageId: string, config: MetaLeadAdsConfig, options: { pageName?: string | null; status?: "not_configured" | "awaiting_subscription" | "connected" | "attention" | "disabled" } = {}) {
  const existing = (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.pageId, pageId)).limit(1))[0];
  if (existing) {
    return existing;
  }
  try {
    const created = await db.insert(metaLeadIntegrations).values({
      pageId,
      pageName: options.pageName ?? null,
      status: options.status ?? (config.graphReady ? "awaiting_subscription" : "not_configured"),
      graphApiVersion: config.graphApiVersion,
    });
    const id = Number((created as Array<{ insertId?: number | bigint }>)[0]?.insertId);
    return { id, pageId };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const raced = (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.pageId, pageId)).limit(1))[0];
    if (!raced) throw error;
    return raced;
  }
}

async function upsertObservedMetaForm(db: Database, integrationId: number, formId: string, details: { formName?: string | null; formStatus?: string | null; lastReceivedAt?: Date | null }) {
  const existing = (await db.select().from(metaLeadForms).where(and(eq(metaLeadForms.integrationId, integrationId), eq(metaLeadForms.metaFormId, formId))).limit(1))[0];
  if (existing) {
    await db.update(metaLeadForms).set({
      formName: details.formName ?? existing.formName,
      formStatus: details.formStatus ?? existing.formStatus,
      lastReceivedAt: details.lastReceivedAt ?? existing.lastReceivedAt,
    }).where(eq(metaLeadForms.id, existing.id));
    return existing;
  }
  try {
    const created = await db.insert(metaLeadForms).values({
      integrationId,
      metaFormId: formId,
      formName: details.formName ?? null,
      formStatus: details.formStatus ?? null,
      lastReceivedAt: details.lastReceivedAt ?? null,
    });
    return { id: Number((created as Array<{ insertId?: number | bigint }>)[0]?.insertId), integrationId, metaFormId: formId };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return (await db.select().from(metaLeadForms).where(and(eq(metaLeadForms.integrationId, integrationId), eq(metaLeadForms.metaFormId, formId))).limit(1))[0];
  }
}

export async function persistMetaLeadWebhookEvents(rawBody: Buffer, payload: unknown) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const config = getMetaLeadAdsConfig();
  const events = parseMetaLeadWebhookPayload(payload);
  const digest = crypto.createHash("sha256").update(rawBody).digest("hex");
  let accepted = 0;
  let duplicates = 0;
  for (const event of events) {
    if (!config.pageId || event.pageId !== config.pageId) continue;
    const existing = (await db.select({ id: metaLeadEvents.id }).from(metaLeadEvents).where(eq(metaLeadEvents.metaLeadId, event.metaLeadId)).limit(1))[0];
    if (existing) {
      duplicates += 1;
      continue;
    }
    const integration = await findOrCreateIntegration(db, event.pageId, config, { status: "connected" });
    try {
      await db.insert(metaLeadEvents).values({
        metaLeadId: event.metaLeadId,
        pageId: event.pageId,
        metaFormId: event.metaFormId,
        metaAdSetId: event.metaAdSetId,
        metaAdId: event.metaAdId,
        providerCreatedAt: event.providerCreatedAt,
        payloadDigest: digest,
        structuralMetadata: JSON.stringify({ object: "page", field: "leadgen", entryTime: event.entryTime?.toISOString() ?? null }),
        processingStatus: "received",
        nextAttemptAt: new Date(),
      });
      if (event.metaFormId) await upsertObservedMetaForm(db, Number(integration.id), event.metaFormId, { lastReceivedAt: event.providerCreatedAt ?? new Date() });
      await db.update(metaLeadIntegrations).set({
        status: "connected",
        graphApiVersion: config.graphApiVersion,
        lastWebhookReceivedAt: new Date(),
        lastErrorAt: null,
        lastErrorCode: null,
      }).where(eq(metaLeadIntegrations.id, Number(integration.id)));
      await db.update(metaLeadTestRuns).set({ status: "webhook_received", webhookReceivedAt: new Date(), errorCode: null }).where(eq(metaLeadTestRuns.metaLeadId, event.metaLeadId));
      accepted += 1;
    } catch (error) {
      if (isDuplicateKeyError(error)) duplicates += 1;
      else throw error;
    }
  }
  return { accepted, duplicates, ignored: events.length - accepted - duplicates };
}

function metaGraphUrl(config: MetaLeadAdsConfig, path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/${config.graphApiVersion}/${path.replace(/^\/+/, "")}`);
  url.searchParams.set("access_token", config.pageAccessToken);
  if (config.appSecret) {
    url.searchParams.set("appsecret_proof", crypto.createHmac("sha256", config.appSecret).update(config.pageAccessToken).digest("hex"));
  }
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function metaGraphRequest(config: MetaLeadAdsConfig, path: string, options: { method?: "GET" | "POST"; params?: Record<string, string> } = {}) {
  if (!config.graphReady) throw new MetaLeadProcessingError("meta_graph_not_configured", false);
  const response = await fetch(metaGraphUrl(config, path, options.params), { method: options.method ?? "GET" });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // The status code remains enough to classify the error without logging provider content.
  }
  if (!response.ok) {
    const code = response.status === 429 || response.status >= 500 ? "meta_graph_temporary_failure" : response.status === 401 || response.status === 403 ? "meta_graph_access_denied" : "meta_graph_request_rejected";
    throw new MetaLeadProcessingError(code, response.status === 429 || response.status >= 500);
  }
  return body as Record<string, unknown>;
}

async function resolveAttribution(config: MetaLeadAdsConfig, lead: MetaGraphLead, event: typeof metaLeadEvents.$inferSelect): Promise<MetaAttribution> {
  const attribution: MetaAttribution = {
    formName: null,
    formStatus: null,
    campaignId: null,
    campaignName: null,
    adSetId: event.metaAdSetId ?? null,
    adSetName: null,
    adId: safeIdentifier(lead.ad_id) ?? event.metaAdId ?? null,
    adName: null,
  };
  const formId = safeIdentifier(lead.form_id) ?? event.metaFormId;
  if (formId) {
    try {
      const form = await metaGraphRequest(config, formId, { params: { fields: "id,name,status" } });
      attribution.formName = safeText(form.name, 255);
      attribution.formStatus = safeText(form.status, 64);
    } catch {
      // Attribution labels are supplementary. A transient label lookup must not lose an otherwise retrievable lead.
    }
  }
  if (attribution.adId) {
    try {
      const ad = await metaGraphRequest(config, attribution.adId, { params: { fields: "id,name,campaign{id,name},adset{id,name}" } });
      const campaign = ad.campaign as Record<string, unknown> | undefined;
      const adSet = ad.adset as Record<string, unknown> | undefined;
      attribution.adName = safeText(ad.name, 255);
      attribution.campaignId = safeIdentifier(campaign?.id);
      attribution.campaignName = safeText(campaign?.name, 255);
      attribution.adSetId = safeIdentifier(adSet?.id) ?? attribution.adSetId;
      attribution.adSetName = safeText(adSet?.name, 255);
    } catch {
      // The required primary lead ingestion remains independent of optional campaign-name resolution.
    }
  }
  return attribution;
}

function externalPhoneMatch(column: unknown, normalizedPhone: string) {
  const lastTen = normalizedPhone.slice(-10);
  return sql`RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column as any}, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''), 10) = ${lastTen}`;
}

function contactMatchPredicate(columns: { email: unknown; phone: unknown }, email: string | null, phone: string | null) {
  if (email && phone) return or(sql`LOWER(TRIM(${columns.email as any})) = ${email}`, externalPhoneMatch(columns.phone, phone));
  if (email) return sql`LOWER(TRIM(${columns.email as any})) = ${email}`;
  if (phone) return externalPhoneMatch(columns.phone, phone);
  return null;
}

async function findExistingMarketingLead(db: Database, email: string | null, phone: string | null) {
  if (!email && !phone) return null;
  const predicate = email && phone
    ? or(eq(marketingLeads.normalizedEmail, email), eq(marketingLeads.normalizedPhone, phone))
    : email ? eq(marketingLeads.normalizedEmail, email) : eq(marketingLeads.normalizedPhone, phone!);
  const found = await db.select().from(marketingLeads).where(predicate).orderBy(desc(marketingLeads.lastActivityAt)).limit(3);
  if (found.length > 1) {
    const exactBoth = found.filter(item => (!email || item.normalizedEmail === email) && (!phone || item.normalizedPhone === phone));
    if (exactBoth.length === 1) return exactBoth[0];
    throw new MetaLeadProcessingError("ambiguous_marketing_lead_match", false);
  }
  return found[0] ?? null;
}

async function findExistingDreamCarzAccount(db: Database, email: string | null, phone: string | null) {
  const predicate = contactMatchPredicate({ email: customerProfiles.email, phone: customerProfiles.phone }, email, phone);
  if (!predicate) return null;
  const rows = await db.select({ userId: customerProfiles.userId, fullName: customerProfiles.fullName, email: customerProfiles.email, phone: customerProfiles.phone })
    .from(customerProfiles).where(predicate as any).limit(3);
  if (rows.length > 1) throw new MetaLeadProcessingError("ambiguous_customer_profile_match", false);
  return rows[0] ?? null;
}

async function linkExistingPublicLeadRecords(db: Database, marketingLeadId: number, email: string | null, phone: string | null) {
  const advertisingPredicate = contactMatchPredicate({ email: advertisingLeads.contactEmail, phone: advertisingLeads.contactPhone }, email, phone);
  if (advertisingPredicate) {
    await db.update(advertisingLeads).set({ marketingLeadId }).where(and(advertisingPredicate as any, sql`${advertisingLeads.marketingLeadId} IS NULL`));
  }
  const inquiryPredicate = contactMatchPredicate({ email: vehicleInquiries.contactEmail, phone: vehicleInquiries.contactPhone }, email, phone);
  if (inquiryPredicate) {
    const inquiries = await db.select({ userId: vehicleInquiries.userId }).from(vehicleInquiries).where(inquiryPredicate as any).limit(3);
    const userIds = Array.from(new Set(inquiries.map(item => item.userId).filter((id): id is number => typeof id === "number")));
    if (userIds.length > 1) throw new MetaLeadProcessingError("ambiguous_vehicle_inquiry_match", false);
    return userIds[0] ?? null;
  }
  return null;
}

async function resolveMarketingLead(db: Database, mapped: ReturnType<typeof mapMetaLeadFields>) {
  const existing = await findExistingMarketingLead(db, mapped.normalizedEmail, mapped.normalizedPhone);
  if (existing) return { lead: existing, created: false, matchedExistingRecord: true };

  const existingAccount = await findExistingDreamCarzAccount(db, mapped.normalizedEmail, mapped.normalizedPhone);
  const inserted = await db.insert(marketingLeads).values({
    stage: "new_meta_lead",
    primarySource: "meta_lead_ads",
    contactName: mapped.contactName,
    contactEmail: mapped.contactEmail,
    contactPhone: mapped.contactPhone,
    normalizedEmail: mapped.normalizedEmail,
    normalizedPhone: mapped.normalizedPhone,
    contactConsentStatus: "meta_form_submitted",
    interest: mapped.interest,
    linkedUserId: existingAccount?.userId ?? null,
    firstSeenAt: new Date(),
    lastActivityAt: new Date(),
  });
  const id = Number((inserted as Array<{ insertId?: number | bigint }>)[0]?.insertId);
  const inferredUserId = await linkExistingPublicLeadRecords(db, id, mapped.normalizedEmail, mapped.normalizedPhone);
  if (!existingAccount?.userId && inferredUserId) {
    await db.update(marketingLeads).set({ linkedUserId: inferredUserId }).where(eq(marketingLeads.id, id));
  }
  const lead = (await db.select().from(marketingLeads).where(eq(marketingLeads.id, id)).limit(1))[0];
  if (!lead) throw new MetaLeadProcessingError("marketing_lead_write_failed", true);
  await db.insert(marketingLeadActivities).values({
    marketingLeadId: lead.id,
    eventType: "lead_created",
    actorType: "system",
    sourceRecordType: "meta_lead_ads",
    summary: existingAccount || inferredUserId ? "Marketing lead linked to an existing DreamCarz contact record." : "Marketing lead created from Meta Lead Ads.",
  });
  return { lead, created: true, matchedExistingRecord: Boolean(existingAccount || inferredUserId) };
}

function retryDelayMs(attempts: number) {
  const base = Math.min(5 * 60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60_000);
  return Math.round(base * (0.85 + Math.random() * 0.3));
}

async function markMetaLeadProcessingFailure(db: Database, event: typeof metaLeadEvents.$inferSelect, error: MetaLeadProcessingError) {
  const attempts = (event.attempts ?? 0) + 1;
  const exhausted = !error.retryable || attempts >= MAX_PROCESSING_ATTEMPTS;
  const nextStatus = exhausted ? "manual_review" : "retry_scheduled";
  await db.update(metaLeadEvents).set({
    processingStatus: nextStatus,
    attempts,
    nextAttemptAt: exhausted ? null : new Date(Date.now() + retryDelayMs(attempts)),
    lastErrorCode: error.code,
    lastErrorAt: new Date(),
  }).where(eq(metaLeadEvents.id, event.id));
  await db.update(metaLeadIntegrations).set({ status: "attention", lastErrorAt: new Date(), lastErrorCode: error.code }).where(eq(metaLeadIntegrations.pageId, event.pageId));
  await db.update(metaLeadTestRuns).set({ status: exhausted ? "manual_review" : "failed", errorCode: error.code }).where(eq(metaLeadTestRuns.metaLeadId, event.metaLeadId));
  return { status: nextStatus, errorCode: error.code, attempts };
}

export async function processMetaLeadEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const event = (await db.select().from(metaLeadEvents).where(eq(metaLeadEvents.id, eventId)).limit(1))[0];
  if (!event) throw new MetaLeadProcessingError("meta_event_not_found", false);
  if (["processed", "ignored"].includes(event.processingStatus)) return { status: event.processingStatus, eventId: event.id };
  if (!["received", "retry_scheduled"].includes(event.processingStatus)) return { status: event.processingStatus, eventId: event.id };

  try {
    const existingSource = (await db.select({ id: metaLeadRecords.id }).from(metaLeadRecords).where(eq(metaLeadRecords.metaLeadId, event.metaLeadId)).limit(1))[0];
    if (existingSource) {
      await db.update(metaLeadEvents).set({ processingStatus: "ignored", processedAt: new Date(), nextAttemptAt: null, lastErrorCode: null, lastErrorAt: null }).where(eq(metaLeadEvents.id, event.id));
      return { status: "ignored", eventId: event.id };
    }

    const config = getMetaLeadAdsConfig();
    if (!config.enabled || !config.pageId || event.pageId !== config.pageId) throw new MetaLeadProcessingError("meta_page_not_allowed", false);
    // Claim the row before retrieving the lead. This conditional update prevents
    // concurrent webhook, administrator, and worker paths from creating two
    // global marketing leads before the provider-ID unique source record exists.
    const claim = await db.update(metaLeadEvents).set({
      processingStatus: "processing",
      attempts: (event.attempts ?? 0) + 1,
      lastErrorCode: null,
      lastErrorAt: null,
    }).where(and(
      eq(metaLeadEvents.id, event.id),
      inArray(metaLeadEvents.processingStatus, ["received", "retry_scheduled"]),
    ));
    const affectedRows = Number((claim as Array<{ affectedRows?: number | bigint }>)[0]?.affectedRows ?? 0);
    if (affectedRows !== 1) {
      const current = (await db.select({ processingStatus: metaLeadEvents.processingStatus }).from(metaLeadEvents).where(eq(metaLeadEvents.id, event.id)).limit(1))[0];
      return { status: current?.processingStatus ?? "ignored", eventId: event.id };
    }
    const sourceLead = await metaGraphRequest(config, event.metaLeadId, { params: { fields: "id,created_time,ad_id,form_id,platform,field_data,custom_disclaimer_responses" } }) as MetaGraphLead;
    const returnedLeadId = safeIdentifier(sourceLead.id);
    if (returnedLeadId !== event.metaLeadId) throw new MetaLeadProcessingError("meta_lead_identifier_mismatch", false);
    const formId = safeIdentifier(sourceLead.form_id) ?? event.metaFormId;
    if (!formId) throw new MetaLeadProcessingError("meta_form_identifier_missing", false);
    const mapped = mapMetaLeadFields(sourceLead.field_data);
    const fieldDataJson = serializeMetaAnswers(sourceLead.field_data, "meta_field_data");
    const disclaimersJson = serializeMetaAnswers(sourceLead.custom_disclaimer_responses, "meta_disclaimer_responses");
    const attribution = await resolveAttribution(config, sourceLead, event);
    const integration = await findOrCreateIntegration(db, event.pageId, config, { status: "connected" });
    await upsertObservedMetaForm(db, Number(integration.id), formId, { formName: attribution.formName, formStatus: attribution.formStatus, lastReceivedAt: safeDateFromMetaTimestamp(sourceLead.created_time) ?? event.providerCreatedAt ?? new Date() });
    const resolution = await resolveMarketingLead(db, mapped);
    const testRun = (await db.select({ id: metaLeadTestRuns.id }).from(metaLeadTestRuns).where(eq(metaLeadTestRuns.metaLeadId, event.metaLeadId)).limit(1))[0];
    try {
      await db.insert(metaLeadRecords).values({
        metaLeadId: event.metaLeadId,
        marketingLeadId: resolution.lead.id,
        metaLeadEventId: event.id,
        pageId: event.pageId,
        formId,
        formName: attribution.formName,
        campaignId: attribution.campaignId,
        campaignName: attribution.campaignName,
        adSetId: attribution.adSetId,
        adSetName: attribution.adSetName,
        adId: attribution.adId,
        adName: attribution.adName,
        sourcePlacement: safeText(sourceLead.platform, 96),
        submittedAt: safeDateFromMetaTimestamp(sourceLead.created_time) ?? event.providerCreatedAt,
        fieldDataJson,
        customDisclaimerResponsesJson: disclaimersJson,
        mappedInterest: mapped.interest,
        isTestLead: Boolean(testRun),
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      await db.update(metaLeadEvents).set({ processingStatus: "ignored", processedAt: new Date(), nextAttemptAt: null }).where(eq(metaLeadEvents.id, event.id));
      return { status: "ignored", eventId: event.id };
    }
    await db.insert(marketingLeadActivities).values({
      marketingLeadId: resolution.lead.id,
      eventType: "meta_lead_received",
      actorType: "provider",
      sourceRecordType: "meta_lead_ads",
      sourceRecordId: event.metaLeadId,
      summary: resolution.created ? "Meta lead received; placed in New Meta Lead." : "Additional Meta lead received and appended to the existing marketing lead.",
      metadata: JSON.stringify({ formId, campaignId: attribution.campaignId, adSetId: attribution.adSetId, adId: attribution.adId, matchedExistingRecord: resolution.matchedExistingRecord }),
    });
    await db.update(marketingLeads).set({ lastActivityAt: new Date(), interest: resolution.lead.interest ?? mapped.interest }).where(eq(marketingLeads.id, resolution.lead.id));
    await db.update(metaLeadEvents).set({ processingStatus: "processed", processedAt: new Date(), nextAttemptAt: null, lastErrorCode: null, lastErrorAt: null }).where(eq(metaLeadEvents.id, event.id));
    await db.update(metaLeadIntegrations).set({ status: "connected", lastSuccessfulLeadAt: new Date(), lastErrorAt: null, lastErrorCode: null }).where(eq(metaLeadIntegrations.id, Number(integration.id)));
    if (testRun) await db.update(metaLeadTestRuns).set({ status: "processed", processedAt: new Date(), errorCode: null }).where(eq(metaLeadTestRuns.id, testRun.id));
    return { status: "processed", eventId: event.id, marketingLeadId: resolution.lead.id };
  } catch (error) {
    const classified = error instanceof MetaLeadProcessingError
      ? error
      : new MetaLeadProcessingError("meta_lead_processing_temporary_failure", true);
    return { eventId: event.id, ...(await markMetaLeadProcessingFailure(db, event, classified)) };
  }
}

export async function processDueMetaLeadEvents(limit = 20, pageId?: string) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const now = new Date();
  const dueCondition = or(
    eq(metaLeadEvents.processingStatus, "received"),
    and(eq(metaLeadEvents.processingStatus, "retry_scheduled"), lte(metaLeadEvents.nextAttemptAt, now)),
    and(eq(metaLeadEvents.processingStatus, "processing"), lte(metaLeadEvents.updatedAt, new Date(now.getTime() - 10 * 60_000))),
  );
  const due = await db.select({ id: metaLeadEvents.id }).from(metaLeadEvents)
    .where(pageId ? and(eq(metaLeadEvents.pageId, pageId), dueCondition) : dueCondition)
    .orderBy(metaLeadEvents.receivedAt)
    .limit(Math.max(1, Math.min(limit, 50)));
  const outcomes = [] as Array<{ status: string; eventId: number }>;
  for (const event of due) outcomes.push(await processMetaLeadEvent(event.id));
  return {
    examined: due.length,
    processed: outcomes.filter(outcome => outcome.status === "processed").length,
    retryScheduled: outcomes.filter(outcome => outcome.status === "retry_scheduled").length,
    manualReview: outcomes.filter(outcome => outcome.status === "manual_review").length,
    ignored: outcomes.filter(outcome => outcome.status === "ignored").length,
  };
}

/** Runs only for the currently allow-listed, server-configured Page. */
export async function processConfiguredDueMetaLeadEvents(limit = 20) {
  const config = getMetaLeadAdsConfig();
  if (!config.enabled || !config.pageId) throw new MetaLeadProcessingError("meta_page_not_allowed", false);
  return processDueMetaLeadEvents(limit, config.pageId);
}

export async function attachMetaLeadRetrySchedule(integrationId: number, taskUid: string, administratorId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const integration = (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.id, integrationId)).limit(1))[0];
  if (!integration) throw new MetaLeadProcessingError("meta_integration_not_found", false);
  await db.update(metaLeadIntegrations).set({ scheduleCronTaskUid: taskUid, updatedByUserId: administratorId }).where(eq(metaLeadIntegrations.id, integration.id));
}

export async function getMetaLeadIntegrationByRetryTask(taskUid: string) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  return (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.scheduleCronTaskUid, taskUid)).limit(1))[0] ?? null;
}

export async function requestMetaLeadTest(formId: string, requestedByUserId: number) {
  const config = getMetaLeadAdsConfig();
  if (!config.graphReady || !config.webhookReady) throw new MetaLeadProcessingError("meta_test_requires_complete_configuration", false);
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const cleanFormId = safeIdentifier(formId);
  if (!cleanFormId) throw new MetaLeadProcessingError("invalid_meta_form_identifier", false);
  const integration = await findOrCreateIntegration(db, config.pageId, config, { status: "awaiting_subscription" });
  const response = await metaGraphRequest(config, `${cleanFormId}/test_leads`, { method: "POST" });
  const metaLeadId = safeIdentifier(response.id);
  if (!metaLeadId) throw new MetaLeadProcessingError("meta_test_lead_identifier_missing", false);
  try {
    await db.insert(metaLeadTestRuns).values({ integrationId: Number(integration.id), formId: cleanFormId, metaLeadId, requestedByUserId });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  const alreadyReceived = (await db.select({ id: metaLeadRecords.id }).from(metaLeadRecords).where(eq(metaLeadRecords.metaLeadId, metaLeadId)).limit(1))[0];
  if (alreadyReceived) {
    await db.update(metaLeadRecords).set({ isTestLead: true }).where(eq(metaLeadRecords.id, alreadyReceived.id));
    await db.update(metaLeadTestRuns).set({ status: "processed", processedAt: new Date(), errorCode: null }).where(eq(metaLeadTestRuns.metaLeadId, metaLeadId));
  }
  await upsertObservedMetaForm(db, Number(integration.id), cleanFormId, { lastReceivedAt: null });
  return { metaLeadId, formId: cleanFormId, integrationId: Number(integration.id) };
}

function safeConfigurationSummary(config: MetaLeadAdsConfig) {
  const missing = [] as string[];
  if (!config.enabled) missing.push("META_LEAD_ADS_ENABLED");
  if (!config.appId) missing.push("META_APP_ID");
  if (!config.appSecret) missing.push("META_APP_SECRET");
  if (!config.webhookVerifyToken) missing.push("META_WEBHOOK_VERIFY_TOKEN");
  if (!config.pageAccessToken) missing.push("META_PAGE_ACCESS_TOKEN");
  if (!config.pageId) missing.push("META_PAGE_ID");
  return { configured: missing.length === 0, missing, graphApiVersion: config.graphApiVersion, pageId: config.pageId || null, callbackUrl: `https://www.dreamcarz.io${META_LEAD_WEBHOOK_PATH}` };
}

export async function getMetaLeadAdminStatus() {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const config = getMetaLeadAdsConfig();
  const configuration = safeConfigurationSummary(config);
  const integration = config.pageId ? (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.pageId, config.pageId)).limit(1))[0] ?? null : null;
  const forms = integration ? await db.select().from(metaLeadForms).where(eq(metaLeadForms.integrationId, integration.id)).orderBy(desc(metaLeadForms.lastReceivedAt)).limit(50) : [];
  const openEvents = await db.select({
    id: metaLeadEvents.id,
    metaLeadId: metaLeadEvents.metaLeadId,
    processingStatus: metaLeadEvents.processingStatus,
    attempts: metaLeadEvents.attempts,
    nextAttemptAt: metaLeadEvents.nextAttemptAt,
    lastErrorCode: metaLeadEvents.lastErrorCode,
    lastErrorAt: metaLeadEvents.lastErrorAt,
    receivedAt: metaLeadEvents.receivedAt,
  }).from(metaLeadEvents).where(inArray(metaLeadEvents.processingStatus, ["received", "processing", "retry_scheduled", "manual_review"])).orderBy(desc(metaLeadEvents.receivedAt)).limit(500);
  const recentTests = integration ? await db.select().from(metaLeadTestRuns).where(eq(metaLeadTestRuns.integrationId, integration.id)).orderBy(desc(metaLeadTestRuns.createdAt)).limit(5) : [];
  return {
    configuration,
    integration,
    forms,
    pendingEvents: openEvents.filter(item => ["received", "processing", "retry_scheduled"].includes(item.processingStatus)).length,
    manualReviewEvents: openEvents.filter(item => item.processingStatus === "manual_review").length,
    errorEvents: openEvents.filter(item => ["retry_scheduled", "manual_review"].includes(item.processingStatus)).slice(0, 20),
    recentTests,
  };
}

export async function refreshMetaLeadConnectionStatus(administratorId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const config = getMetaLeadAdsConfig();
  if (!config.pageId || !config.graphReady) throw new MetaLeadProcessingError("meta_graph_not_configured", false);
  try {
    const page = await metaGraphRequest(config, config.pageId, { params: { fields: "id,name,leadgen_forms{id,name,status}" } });
    const subscriptions = await metaGraphRequest(config, `${config.pageId}/subscribed_apps`);
    const subscriptionData = Array.isArray(subscriptions.data) ? subscriptions.data as Array<Record<string, unknown>> : [];
    const appSubscription = subscriptionData.find(item => safeIdentifier(item.id) === config.appId);
    const fields = Array.isArray(appSubscription?.subscribed_fields) ? appSubscription?.subscribed_fields : [];
    const hasLeadgenSubscription = fields.includes("leadgen");
    const integration = await findOrCreateIntegration(db, config.pageId, config, { pageName: safeText(page.name, 255), status: hasLeadgenSubscription ? "connected" : "awaiting_subscription" });
    await db.update(metaLeadIntegrations).set({
      pageName: safeText(page.name, 255),
      status: hasLeadgenSubscription ? "connected" : "awaiting_subscription",
      graphApiVersion: config.graphApiVersion,
      lastErrorAt: null,
      lastErrorCode: null,
      updatedByUserId: administratorId,
    }).where(eq(metaLeadIntegrations.id, Number(integration.id)));
    const formEntries = Array.isArray(page.leadgen_forms) ? page.leadgen_forms as Array<Record<string, unknown>> : [];
    for (const form of formEntries) {
      const id = safeIdentifier(form.id);
      if (id) await upsertObservedMetaForm(db, Number(integration.id), id, { formName: safeText(form.name, 255), formStatus: safeText(form.status, 64) });
    }
  } catch (error) {
    const classified = error instanceof MetaLeadProcessingError ? error : new MetaLeadProcessingError("meta_connection_check_failed", true);
    const existing = (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.pageId, config.pageId)).limit(1))[0];
    if (existing) await db.update(metaLeadIntegrations).set({ status: "attention", lastErrorAt: new Date(), lastErrorCode: classified.code, updatedByUserId: administratorId }).where(eq(metaLeadIntegrations.id, existing.id));
    throw classified;
  }
  return getMetaLeadAdminStatus();
}

/**
 * Subscribes only the configured Page and only the documented leadgen field.
 * This is intentionally administrator-gated through the tRPC caller; it does
 * not inspect or alter campaigns, ad sets, ads, budgets, audiences, or forms.
 */
export async function subscribeMetaLeadPageLeadgen(administratorId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const config = getMetaLeadAdsConfig();
  if (!config.enabled || !config.pageId || !config.graphReady) throw new MetaLeadProcessingError("meta_graph_not_configured", false);
  try {
    await metaGraphRequest(config, `${config.pageId}/subscribed_apps`, {
      method: "POST",
      params: { subscribed_fields: "leadgen" },
    });
    const status = await refreshMetaLeadConnectionStatus(administratorId);
    if (status.integration?.status !== "connected") throw new MetaLeadProcessingError("meta_page_subscription_not_confirmed", true);
    return status;
  } catch (error) {
    const classified = error instanceof MetaLeadProcessingError ? error : new MetaLeadProcessingError("meta_page_subscription_failed", true);
    const integration = (await db.select().from(metaLeadIntegrations).where(eq(metaLeadIntegrations.pageId, config.pageId)).limit(1))[0];
    if (integration) {
      await db.update(metaLeadIntegrations).set({
        status: "attention",
        lastErrorAt: new Date(),
        lastErrorCode: classified.code,
        updatedByUserId: administratorId,
      }).where(eq(metaLeadIntegrations.id, integration.id));
    }
    throw classified;
  }
}

export async function retryMetaLeadEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const event = (await db.select().from(metaLeadEvents).where(eq(metaLeadEvents.id, eventId)).limit(1))[0];
  if (!event) throw new MetaLeadProcessingError("meta_event_not_found", false);
  await db.update(metaLeadEvents).set({ processingStatus: "received", nextAttemptAt: new Date(), lastErrorCode: null, lastErrorAt: null }).where(eq(metaLeadEvents.id, event.id));
  return processMetaLeadEvent(event.id);
}

export async function listMarketingLeads(limit = 25) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const leads = await db.select().from(marketingLeads).orderBy(desc(marketingLeads.lastActivityAt)).limit(Math.max(1, Math.min(limit, 100)));
  if (!leads.length) return [];
  const ids = leads.map(lead => lead.id);
  const sourceRecords = await db.select().from(metaLeadRecords).where(inArray(metaLeadRecords.marketingLeadId, ids)).orderBy(desc(metaLeadRecords.createdAt));
  return leads.map(lead => ({
    ...lead,
    latestMetaAttribution: sourceRecords.find(record => record.marketingLeadId === lead.id) ?? null,
  }));
}

export async function getMarketingLeadDetail(marketingLeadId: number) {
  const db = await getDb();
  if (!db) throw new MetaLeadProcessingError("database_unavailable", true);
  const lead = (await db.select().from(marketingLeads).where(eq(marketingLeads.id, marketingLeadId)).limit(1))[0];
  if (!lead) throw new MetaLeadProcessingError("marketing_lead_not_found", false);
  const [activities, metaRecords] = await Promise.all([
    db.select().from(marketingLeadActivities).where(eq(marketingLeadActivities.marketingLeadId, marketingLeadId)).orderBy(desc(marketingLeadActivities.createdAt)).limit(100),
    db.select().from(metaLeadRecords).where(eq(metaLeadRecords.marketingLeadId, marketingLeadId)).orderBy(desc(metaLeadRecords.createdAt)).limit(50),
  ]);
  const linkedAccount = lead.linkedUserId
    ? (await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, lead.linkedUserId)).limit(1))[0] ?? null
    : null;
  return { lead, activities, metaRecords, linkedAccount };
}
