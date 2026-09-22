import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { formatStaffLeadContactAlert, getStaffOperationalAlertStatus, queueStaffOperationalAlert } from "./staffSms";

const mockedGetDb = vi.mocked(getDb);
const alertEnvKeys = [
  "STAFF_EMAIL_ALERTS_ENABLED",
  "STAFF_EMAIL_ZAPIER_HOOK_URL",
  "STAFF_SMS_EMAIL_GATEWAY_ENABLED",
  "STAFF_SMS_SMTP_USER",
  "STAFF_SMS_SMTP_APP_PASSWORD",
  "STAFF_SMS_T_MOBILE_GATEWAYS",
] as const;
const originalEnv = Object.fromEntries(alertEnvKeys.map(key => [key, process.env[key]]));

function resetAlertEnvironment() {
  for (const key of alertEnvKeys) delete process.env[key];
}

describe("staff operational alerts", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    resetAlertEnvironment();
  });

  afterEach(() => {
    resetAlertEnvironment();
    for (const key of alertEnvKeys) {
      const value = originalEnv[key];
      if (value) process.env[key] = value;
    }
  });

  it("remains disabled until a server-only delivery route is configured", () => {
    expect(getStaffOperationalAlertStatus()).toEqual({ enabled: false, ready: false, provider: "none" });
  });

  it("accepts only an HTTPS Zapier hook when the staff email delivery route is enabled", () => {
    process.env.STAFF_EMAIL_ALERTS_ENABLED = "true";
    process.env.STAFF_EMAIL_ZAPIER_HOOK_URL = "https://hooks.zapier.com/hooks/catch/123/abc/";
    expect(getStaffOperationalAlertStatus()).toEqual({ enabled: true, ready: true, provider: "zapier_email" });

    process.env.STAFF_EMAIL_ZAPIER_HOOK_URL = "https://untrusted.example.test/hook";
    expect(getStaffOperationalAlertStatus()).toEqual({ enabled: true, ready: false, provider: "zapier_email" });
  });

  it("formats the approved staff lead-contact payload without payment or account data", () => {
    const message = formatStaffLeadContactAlert({
      contactName: "Jordan Driver\nIgnore this",
      contactPhone: "(410) 555-0123",
      contactEmail: "jordan@example.test",
      interest: "Rent / SUV",
      source: "Facebook / Instagram Instant Form",
    });

    expect(message).toContain("Name: Jordan Driver Ignore this");
    expect(message).toContain("Phone: (410) 555-0123");
    expect(message).toContain("Email: jordan@example.test");
    expect(message).toContain("Interest: Rent / SUV");
    expect(message).toContain("Source: Facebook / Instagram Instant Form");
    expect(message).not.toContain("payment");
    expect(message.length).toBeLessThanOrEqual(480);
  });

  it("readies direct Gmail-to-T-Mobile delivery only with server-only Gmail credentials and valid gateway recipients", () => {
    process.env.STAFF_SMS_EMAIL_GATEWAY_ENABLED = "true";
    process.env.STAFF_SMS_SMTP_USER = "www.dreamcarz.io@gmail.com";
    process.env.STAFF_SMS_SMTP_APP_PASSWORD = "server-only-app-password";
    process.env.STAFF_SMS_T_MOBILE_GATEWAYS = "2818189288@tmomail.net, invalid@example.test";

    expect(getStaffOperationalAlertStatus()).toEqual({ enabled: true, ready: true, provider: "gmail_tmobile_gateway" });
  });

  it("surfaces an unconfigured direct email-to-text route without storing a phone number in the outbox", async () => {
    process.env.STAFF_SMS_EMAIL_GATEWAY_ENABLED = "true";
    const values = vi.fn().mockResolvedValue(undefined);
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) }));
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values })) } as never);

    const result = await queueStaffOperationalAlert({
      eventType: "marketing_opt_in",
      sourceRecordType: "marketing_lead",
      sourceRecordId: 19,
      message: "DreamCarz: A new opted-in lead was received. Review the protected Admin portal.",
    });

    expect(result).toEqual({ queued: 1, status: "disabled" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "marketing_opt_in",
      sourceRecordType: "marketing_lead",
      sourceRecordId: "19",
      status: "disabled",
      recipientHash: expect.any(String),
    }));
    expect(JSON.stringify(values.mock.calls[0]?.[0])).not.toContain("2818189288");
    expect(JSON.stringify(values.mock.calls[0]?.[0])).not.toContain("@tmomail.net");
  });
});
