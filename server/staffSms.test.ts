import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { getStaffSmsNotificationStatus, queueStaffSmsNotifications } from "./staffSms";

const mockedGetDb = vi.mocked(getDb);
const smsEnvKeys = [
  "STAFF_SMS_NOTIFICATIONS_ENABLED",
  "STAFF_SMS_TWILIO_ACCOUNT_SID",
  "STAFF_SMS_TWILIO_AUTH_TOKEN",
  "STAFF_SMS_TWILIO_FROM",
  "STAFF_SMS_TWILIO_MESSAGING_SERVICE_SID",
  "STAFF_SMS_RECIPIENTS",
] as const;

const originalEnv = Object.fromEntries(smsEnvKeys.map(key => [key, process.env[key]]));

function resetSmsEnvironment() {
  for (const key of smsEnvKeys) delete process.env[key];
}

describe("staff SMS notifications", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    resetSmsEnvironment();
  });

  afterEach(() => {
    resetSmsEnvironment();
    for (const key of smsEnvKeys) {
      const value = originalEnv[key];
      if (value) process.env[key] = value;
    }
  });

  it("remains disabled until explicit provider credentials and staff recipients are configured", () => {
    expect(getStaffSmsNotificationStatus()).toEqual({
      enabled: false,
      ready: false,
      recipientCount: 0,
      provider: "twilio",
    });
  });

  it("recognizes a complete server-only Twilio configuration without exposing it", () => {
    process.env.STAFF_SMS_NOTIFICATIONS_ENABLED = "true";
    process.env.STAFF_SMS_TWILIO_ACCOUNT_SID = "ACtest";
    process.env.STAFF_SMS_TWILIO_AUTH_TOKEN = "test-secret";
    process.env.STAFF_SMS_TWILIO_FROM = "+15555550101";
    process.env.STAFF_SMS_RECIPIENTS = "+15555550102,+15555550103";

    expect(getStaffSmsNotificationStatus()).toEqual({
      enabled: true,
      ready: true,
      recipientCount: 2,
      provider: "twilio",
    });
  });

  it("records one disabled, recipient-hashed outbox item per configured staff recipient before activation", async () => {
    process.env.STAFF_SMS_RECIPIENTS = "+15555550102";
    const values = vi.fn().mockResolvedValue(undefined);
    const select = vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })),
    }));
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values })) } as never);

    const result = await queueStaffSmsNotifications({
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
    expect(JSON.stringify(values.mock.calls[0]?.[0])).not.toContain("+15555550102");
  });
});
