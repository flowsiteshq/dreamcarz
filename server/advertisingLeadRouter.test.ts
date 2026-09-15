import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({ consumeRateLimit: vi.fn(() => ({ allowed: true })), rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`) }));
vi.mock("./_core/llm", () => ({ listLLMModels: vi.fn(), invokeLLM: vi.fn() }));
vi.mock("./elevenLabsTranscription", () => ({ transcribeConciergeVoice: vi.fn() }));
vi.mock("./elevenLabsVoiceAgent", () => ({ createDreamCarzVoiceSession: vi.fn() }));
vi.mock("./masterProgramConfig", () => ({ getActiveMasterProgramConfiguration: vi.fn() }));
vi.mock("./subscriptionRateCards", () => ({ getActiveSubscriptionRateCard: vi.fn(), RATE_NOT_CONFIGURED: "RATE_NOT_CONFIGURED" }));

import { getDb } from "./db";
import { consumeRateLimit } from "./rateLimit";
import { appRouter } from "./routers";

const guestContext = { req: { headers: {}, ip: "203.0.113.94" }, res: {} };
const landingPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/GetStarted.tsx"), "utf8");

describe("public advertising lead capture", () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset();
    vi.mocked(consumeRateLimit).mockReset();
    vi.mocked(consumeRateLimit).mockReturnValue({ allowed: true, remaining: 4, retryAfterMs: 0 });
  });

  it("stores only consented contact details and returns an opaque reference for the Concierge handoff", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 12 }]);
    vi.mocked(getDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);

    const result = await appRouter.createCaller(guestContext as never).advertisingLeads.capture({
      contactName: "Jordan Driver",
      contactPhone: "(410) 555-0123",
      contactEmail: "jordan@example.test",
      consentToContact: true,
    });

    expect(result).toMatchObject({ success: true, reference: expect.stringMatching(/^ADL-\d{4}-[A-Z0-9]{7}$/) });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      contactName: "Jordan Driver", contactPhone: "(410) 555-0123", contactEmail: "jordan@example.test", consentToContact: true, source: "facebook",
    }));
    expect(values.mock.calls[0]?.[0]).not.toHaveProperty("notes");
  });

  it("requires explicit contact consent before any database write", async () => {
    const insert = vi.fn();
    vi.mocked(getDb).mockResolvedValue({ insert } as never);
    await expect(appRouter.createCaller(guestContext as never).advertisingLeads.capture({ contactName: "Jordan Driver", contactPhone: "4105550123", contactEmail: "jordan@example.test", consentToContact: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("uses a private session handoff rather than appending contact data to the Concierge URL", () => {
    expect(landingPageSource).toContain("saveAdvertisingLeadHandoff");
    expect(landingPageSource).toContain('navigate("/concierge")');
    expect(landingPageSource).not.toContain("/concierge?");
    expect(landingPageSource).toContain("Please do not enter payment, driver-license, or password details here.");
  });
});
