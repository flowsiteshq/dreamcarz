import type { Express } from "express";
import { sdk } from "./_core/sdk";
import { META_LEAD_RETRY_PATH, MetaLeadProcessingError, getMetaLeadIntegrationByRetryTask, processDueMetaLeadEvents } from "./metaLeadAds";

/** Scheduled retry endpoint. It accepts only platform-authenticated scheduled work. */
export function registerMetaLeadAdsRetryRoute(app: Express) {
  app.post(META_LEAD_RETRY_PATH, async (req, res) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ ok: false, code: "cron_only" });
      const integration = await getMetaLeadIntegrationByRetryTask(caller.taskUid);
      if (!integration) return res.status(200).json({ ok: true, skipped: "orphaned_meta_retry_schedule" });
      const result = await processDueMetaLeadEvents(20, integration.pageId);
      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      const code = error instanceof MetaLeadProcessingError ? error.code : "meta_retry_handler_failed";
      return res.status(500).json({ ok: false, code, timestamp: new Date().toISOString() });
    }
  });
}
