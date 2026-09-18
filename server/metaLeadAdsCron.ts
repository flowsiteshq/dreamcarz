import "dotenv/config";
import { MetaLeadProcessingError, processConfiguredDueMetaLeadEvents } from "./metaLeadAds";
import { processDueStaffOperationalAlerts } from "./staffSms";

/**
 * One-shot Railway Cron entry point. This worker intentionally has no HTTP
 * listener and exits after processing a bounded batch of due Meta lead events.
 * It is deployed as a separate service, never as the web application's start
 * command, because Railway Cron expects the service process to terminate.
 */
async function main() {
  try {
    const [metaLeadResult, staffSmsResult] = await Promise.all([
      processConfiguredDueMetaLeadEvents(20),
      processDueStaffOperationalAlerts(20),
    ]);
    console.log(JSON.stringify({ ok: true, worker: "meta-lead-retry", metaLeadResult, staffSmsResult }));
    process.exit(0);
  } catch (error) {
    const code = error instanceof MetaLeadProcessingError ? error.code : "meta_lead_retry_worker_failed";
    console.error(JSON.stringify({ ok: false, worker: "meta-lead-retry", code }));
    process.exit(1);
  }
}

void main();
