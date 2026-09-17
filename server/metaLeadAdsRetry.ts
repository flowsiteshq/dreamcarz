import crypto from "node:crypto";
import type { Express } from "express";
import { META_LEAD_RETRY_PATH, MetaLeadProcessingError, processConfiguredDueMetaLeadEvents } from "./metaLeadAds";

function hasValidRetryBearer(value: string | undefined, expected: string | undefined) {
  const received = /^Bearer\s+(.+)$/i.exec(value ?? "")?.[1];
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

/** Railway Cron invokes this route with a server-only bearer credential. */
export function registerMetaLeadAdsRetryRoute(app: Express) {
  app.post(META_LEAD_RETRY_PATH, async (req, res) => {
    const retrySecret = process.env.META_LEAD_RETRY_SECRET?.trim();
    if (!retrySecret) return res.status(503).json({ ok: false, code: "meta_retry_not_configured" });
    if (!hasValidRetryBearer(req.headers.authorization, retrySecret)) return res.status(401).json({ ok: false, code: "unauthorized" });
    try {
      const result = await processConfiguredDueMetaLeadEvents(20);
      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      const code = error instanceof MetaLeadProcessingError ? error.code : "meta_retry_handler_failed";
      return res.status(500).json({ ok: false, code, timestamp: new Date().toISOString() });
    }
  });
}
