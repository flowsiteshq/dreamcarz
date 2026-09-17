import express, { type Express } from "express";
import {
  META_LEAD_WEBHOOK_PATH,
  getMetaLeadAdsConfig,
  processDueMetaLeadEvents,
  persistMetaLeadWebhookEvents,
  verifyMetaLeadWebhookSignature,
  verifyMetaLeadWebhookToken,
} from "./metaLeadAds";

/** Registers Meta's raw-body verification and leadgen notification endpoint before JSON parsing. */
export function registerMetaLeadAdsWebhook(app: Express) {
  app.get(META_LEAD_WEBHOOK_PATH, (req, res) => {
    const config = getMetaLeadAdsConfig();
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (!config.webhookReady || typeof challenge !== "string" || !verifyMetaLeadWebhookToken(mode, token, config.webhookVerifyToken)) {
      return res.status(403).send("forbidden");
    }
    return res.status(200).type("text/plain").send(challenge);
  });

  app.post(META_LEAD_WEBHOOK_PATH, express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const config = getMetaLeadAdsConfig();
    const signature = req.headers["x-hub-signature-256"];
    if (!config.webhookReady || !Buffer.isBuffer(req.body)) return res.status(503).json({ received: false, code: "meta_webhook_not_configured" });
    if (!verifyMetaLeadWebhookSignature(req.body, signature, config.appSecret)) return res.status(403).json({ received: false, code: "invalid_meta_signature" });
    let payload: unknown;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ received: false, code: "invalid_meta_payload" });
    }
    try {
      const result = await persistMetaLeadWebhookEvents(req.body, payload);
      // The durable inbox is written before Graph retrieval. Process the small
      // due batch immediately so a healthy delivery appears in the CRM without
      // waiting for the Railway worker, while every recoverable failure remains
      // available for bounded scheduled retry.
      const immediate = result.accepted > 0 && config.pageId
        ? await processDueMetaLeadEvents(Math.min(result.accepted, 10), config.pageId)
        : { examined: 0, processed: 0, retryScheduled: 0, manualReview: 0, ignored: 0 };
      return res.status(200).json({ received: true, accepted: result.accepted, duplicate: result.duplicates, ignored: result.ignored, immediate });
    } catch {
      return res.status(503).json({ received: false, code: "meta_event_inbox_unavailable" });
    }
  });
}
