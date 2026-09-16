import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { appRouter } from "./routers";
import {
  getMetaLeadAdsConfig,
  mapMetaLeadFields,
  normalizeMetaLeadEmail,
  normalizeMetaLeadPhone,
  parseMetaLeadWebhookPayload,
  verifyMetaLeadWebhookSignature,
  verifyMetaLeadWebhookToken,
} from "./metaLeadAds";

describe("Meta Lead Ads security primitives", () => {
  it("accepts only the documented HMAC-SHA256 signature over the raw body", () => {
    const body = Buffer.from('{"object":"page"}', "utf8");
    const secret = "test-app-secret";
    const signature = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyMetaLeadWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaLeadWebhookSignature(body, signature.replace(/.$/, "0"), secret)).toBe(false);
    expect(verifyMetaLeadWebhookSignature(body, undefined, secret)).toBe(false);
    expect(verifyMetaLeadWebhookSignature(body, "sha1=abcd", secret)).toBe(false);
  });

  it("requires the correct subscription mode and verification token", () => {
    expect(verifyMetaLeadWebhookToken("subscribe", "approved-token", "approved-token")).toBe(true);
    expect(verifyMetaLeadWebhookToken("subscribe", "wrong-token", "approved-token")).toBe(false);
    expect(verifyMetaLeadWebhookToken("unsubscribe", "approved-token", "approved-token")).toBe(false);
  });

  it("parses only Page leadgen events, rejects unsafe identifiers, and de-duplicates a repeated delivery entry", () => {
    const parsed = parseMetaLeadWebhookPayload({
      object: "page",
      entry: [{
        id: "page-123",
        time: 1_789_000_000,
        changes: [
          { field: "leadgen", value: { leadgen_id: "lead-123", form_id: "form-456", adgroup_id: "adset-789", ad_id: "ad-222", created_time: 1_789_000_001 } },
          { field: "leadgen", value: { leadgen_id: "lead-123", form_id: "form-456" } },
          { field: "feed", value: { leadgen_id: "must-not-import" } },
          { field: "leadgen", value: { leadgen_id: "not a safe id" } },
        ],
      }],
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ metaLeadId: "lead-123", pageId: "page-123", metaFormId: "form-456", metaAdSetId: "adset-789", metaAdId: "ad-222" });
    expect(parseMetaLeadWebhookPayload({ object: "instagram", entry: [] })).toEqual([]);
  });

  it("maps standard contact fields and retains normalized duplicate-lookup values without inventing an interest", () => {
    const mapped = mapMetaLeadFields([
      { name: "first_name", values: ["Avery"] },
      { name: "last_name", values: ["Driver"] },
      { name: "email", values: [" Avery.Driver@Example.Test "] },
      { name: "phone_number", values: ["+1 (410) 555-0198"] },
      { name: "vehicle_interest", values: ["Rent / SUV"] },
      { name: "custom_question", values: ["Retain this answer in source JSON"] },
    ]);

    expect(mapped).toMatchObject({
      contactName: "Avery Driver",
      contactEmail: "Avery.Driver@Example.Test",
      contactPhone: "+1 (410) 555-0198",
      normalizedEmail: "avery.driver@example.test",
      normalizedPhone: "4105550198",
      interest: "Rent / SUV",
    });
    expect(normalizeMetaLeadEmail(" ")).toBeNull();
    expect(normalizeMetaLeadPhone("not a telephone")).toBeNull();
  });

  it("requires explicit server-side enablement and never returns a configuration value to client code", () => {
    const missing = getMetaLeadAdsConfig({ META_APP_ID: "app", META_APP_SECRET: "secret", META_WEBHOOK_VERIFY_TOKEN: "verify", META_PAGE_ACCESS_TOKEN: "token", META_PAGE_ID: "page" });
    const enabled = getMetaLeadAdsConfig({ META_LEAD_ADS_ENABLED: "true", META_APP_ID: "app", META_APP_SECRET: "secret", META_WEBHOOK_VERIFY_TOKEN: "verify", META_PAGE_ACCESS_TOKEN: "token", META_PAGE_ID: "page", META_GRAPH_API_VERSION: "v26.0" });

    expect(missing.webhookReady).toBe(false);
    expect(enabled.webhookReady).toBe(true);
    expect(enabled.graphReady).toBe(true);
  });
});

describe("Meta Lead Ads application boundaries", () => {
  it("registers the raw Meta webhook before JSON parsing and protects administrator procedures", async () => {
    const serverSource = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const retrySource = readFileSync(new URL("./metaLeadAdsRetry.ts", import.meta.url), "utf8");
    expect(serverSource.indexOf("registerMetaLeadAdsWebhook(app)")).toBeLessThan(serverSource.indexOf("express.json"));
    expect(routerSource).toContain("metaLeadAds: router({");
    expect(routerSource).toContain("status: adminProcedure.query");
    expect(routerSource).toContain("enableRetrySchedule: adminProcedure.mutation");
    expect(retrySource).toContain("caller.isCron || !caller.taskUid");
    expect(retrySource).toContain("getMetaLeadIntegrationByRetryTask(caller.taskUid)");
    expect(retrySource).toContain("processDueMetaLeadEvents(20, integration.pageId)");

    const nonAdmin = appRouter.createCaller({ user: { id: 9, role: "user" }, req: { headers: {} }, res: {} } as never);
    await expect(nonAdmin.metaLeadAds.status()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("contains no paid-campaign mutation operations in the Meta lead service", () => {
    const serviceSource = readFileSync(new URL("./metaLeadAds.ts", import.meta.url), "utf8");
    expect(serviceSource).not.toMatch(/\/campaigns[^\n]*(POST|PATCH|DELETE)/i);
    expect(serviceSource).not.toContain("adsets");
  });
});
