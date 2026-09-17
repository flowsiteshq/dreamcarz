import express, { type Express } from "express";
import {
  ZAPIER_META_LEAD_INGEST_PATH,
  getZapierMetaLeadConfig,
  MetaLeadProcessingError,
  parseZapierMetaLeadPayload,
  persistZapierMetaLeadEvent,
  processMetaLeadEvent,
  verifyZapierMetaLeadAuthorization,
} from "./metaLeadAds";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";

/**
 * Receives a Zapier Custom Request action that is triggered by Meta's Facebook
 * Lead Ads “New Lead” event. The static bearer is generated independently for
 * this endpoint, stays in Railway and Zapier only, and is never logged.
 */
export function registerZapierMetaLeadWebhook(app: Express) {
  app.post(ZAPIER_META_LEAD_INGEST_PATH, express.raw({ type: "application/json", limit: "256kb" }), async (req, res) => {
    const config = getZapierMetaLeadConfig();
    if (!config.ready) return res.status(503).json({ received: false, code: "zapier_meta_lead_not_configured" });
    if (!verifyZapierMetaLeadAuthorization(req.headers.authorization, config.ingestSecret)) {
      return res.status(401).json({ received: false, code: "unauthorized" });
    }
    const limit = consumeRateLimit({ key: rateLimitKey(req, "zapier_meta_lead_delivery", config.pageId), limit: 60, windowMs: 60 * 60_000 });
    if (!limit.allowed) return res.status(429).json({ received: false, code: "rate_limited" });
    if (!Buffer.isBuffer(req.body)) return res.status(400).json({ received: false, code: "invalid_zapier_payload" });

    let payload: unknown;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
      // Reject malformed data before creating an inbox record, while retaining
      // all valid custom fields through the parser's raw-payload path.
      parseZapierMetaLeadPayload(payload);
    } catch (error) {
      const code = error instanceof MetaLeadProcessingError ? error.code : "invalid_zapier_payload";
      return res.status(400).json({ received: false, code });
    }

    try {
      const persisted = await persistZapierMetaLeadEvent(payload);
      // Reprocess a duplicate delivery as well: Zapier retries are useful when
      // an earlier database/processing attempt was interrupted after inbox
      // persistence but before its source record was committed.
      const immediate = persisted.eventId
        ? await processMetaLeadEvent(persisted.eventId)
        : { status: "duplicate", eventId: persisted.eventId };
      if (immediate.status === "retry_scheduled") {
        return res.status(503).json({ received: true, accepted: persisted.accepted, duplicate: persisted.duplicates, immediate });
      }
      if (immediate.status === "manual_review") {
        return res.status(422).json({ received: true, accepted: persisted.accepted, duplicate: persisted.duplicates, immediate });
      }
      return res.status(200).json({ received: true, accepted: persisted.accepted, duplicate: persisted.duplicates, immediate });
    } catch (error) {
      const code = error instanceof MetaLeadProcessingError ? error.code : "zapier_meta_event_inbox_unavailable";
      const status = error instanceof MetaLeadProcessingError && !error.retryable ? 422 : 503;
      return res.status(status).json({ received: false, code });
    }
  });
}
