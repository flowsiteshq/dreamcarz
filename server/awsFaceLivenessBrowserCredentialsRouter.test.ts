import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({
  consumeRateLimit: vi.fn(() => ({ allowed: true, remaining: 2, retryAfterMs: 0 })),
  rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`),
}));
vi.mock("./awsFaceLiveness", () => ({
  createAwsFaceLivenessBrowserCredentials: vi.fn(),
  createAwsFaceLivenessSession: vi.fn(),
  getAwsFaceLivenessResult: vi.fn(),
  getAwsFaceLivenessStatus: vi.fn(),
}));

import { createAwsFaceLivenessBrowserCredentials, createAwsFaceLivenessSession, getAwsFaceLivenessStatus } from "./awsFaceLiveness";
import { getDb } from "./db";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedCreateCredentials = vi.mocked(createAwsFaceLivenessBrowserCredentials);
const mockedCreateSession = vi.mocked(createAwsFaceLivenessSession);
const mockedProviderStatus = vi.mocked(getAwsFaceLivenessStatus);
const mockedConsumeRateLimit = vi.mocked(consumeRateLimit);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };
const provider = { provider: "aws_face_liveness" as const, region: "us-east-1", serverCredentialsConfigured: true, browserCredentialBrokerConfigured: true, browserFlowEnabled: true, enabled: true, configured: true, mode: "ready" as const };

function pendingOwnedSession() {
  return {
    id: 41,
    reference: "DCR-2026-LIVE",
    userId: 77,
    currentStep: "identity",
    identityStatus: "pending",
    identityProvider: "aws_face_liveness",
    identitySessionId: "6bb0b0be-5c8a-4e41-a8bd-5485304c7e02",
  };
}

function databaseFor({ transaction = pendingOwnedSession(), consents = ["identity_document", "identity_biometric"] as string[] } = {}) {
  const values = vi.fn().mockResolvedValue(undefined);
  const transactionLimit = vi.fn().mockResolvedValue(transaction ? [transaction] : []);
  const select = vi.fn((projection?: unknown) => {
    if (projection) return { from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(consents.map(consentType => ({ consentType }))) })) };
    return { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: transactionLimit })) })) };
  });
  return {
    values,
    transactionLimit,
    db: {
      select,
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    },
  };
}

describe("AWS Face Liveness browser credential broker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedConsumeRateLimit.mockReturnValue({ allowed: true, remaining: 2, retryAfterMs: 0 });
    mockedRateLimitKey.mockImplementation((_: unknown, scope: string, subject: string) => `${scope}:${subject}`);
    mockedProviderStatus.mockReturnValue(provider);
  });

  it("throttles browser-credential requests before any transaction lookup or credential operation", async () => {
    mockedConsumeRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "aws_face_liveness_browser_credentials", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
    expect(mockedCreateCredentials).not.toHaveBeenCalled();
  });

  it("does not issue credentials when the IAM setup remains in manual-review mode", async () => {
    const { db } = databaseFor();
    mockedGetDb.mockResolvedValue(db as never);
    mockedProviderStatus.mockReturnValue({ ...provider, browserFlowEnabled: false, configured: false, mode: "manual_review" });

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE" })).resolves.toMatchObject({ granted: false, provider: { mode: "manual_review" } });

    expect(mockedCreateCredentials).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not issue credentials when an account-owned pending identity session is unavailable", async () => {
    const { db } = databaseFor({ transaction: null as never });
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-OTHER" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(mockedCreateCredentials).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("requires both active recorded consents before it can issue temporary credentials", async () => {
    const { db } = databaseFor({ consents: ["identity_document"] });
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(mockedCreateCredentials).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("issues credentials only for a pending owned session and audits no credential material", async () => {
    const { db, values } = databaseFor();
    mockedGetDb.mockResolvedValue(db as never);
    mockedCreateCredentials.mockResolvedValue({
      configured: true,
      provider,
      credentials: { accessKeyId: "temporary-access-key", secretAccessKey: "temporary-secret", sessionToken: "temporary-token", expiration: new Date("2026-09-01T00:00:00.000Z") },
    });

    const result = await appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE" });

    expect(result).toMatchObject({
      granted: true,
      sessionId: "6bb0b0be-5c8a-4e41-a8bd-5485304c7e02",
      credentials: { accessKeyId: "temporary-access-key", sessionToken: "temporary-token" },
    });
    expect(values).toHaveBeenCalledTimes(1);
    const auditEvent = values.mock.calls[0]?.[0] as { metadata?: string };
    expect(auditEvent.metadata).toContain("start_face_liveness_only");
    expect(auditEvent.metadata).not.toContain("temporary-access-key");
    expect(auditEvent.metadata).not.toContain("temporary-token");
    expect(auditEvent.metadata).not.toContain("temporary-secret");
  });

  it("does not record a credential-issuance event when the provider rejects the role assumption", async () => {
    const { db, values } = databaseFor();
    mockedGetDb.mockResolvedValue(db as never);
    mockedCreateCredentials.mockRejectedValue(new Error("AssumeRole denied"));

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE" })).rejects.toThrow("AssumeRole denied");

    expect(values).not.toHaveBeenCalled();
  });

  it("records consent before creating a server-side opaque session for the future browser handoff", async () => {
    const transaction = { ...pendingOwnedSession(), identityStatus: "not_started", identityProvider: null, identitySessionId: null };
    const { db, values } = databaseFor({ transaction });
    mockedGetDb.mockResolvedValue(db as never);
    mockedCreateSession.mockResolvedValue({ configured: true, provider, sessionId: "6bb0b0be-5c8a-4e41-a8bd-5485304c7e02" });

    const result = await appRouter.createCaller(memberContext as never).transactions.startAwsFaceLiveness({ reference: "DCR-2026-LIVE", identityDocumentConsent: true, biometricConsent: true });

    expect(result).toMatchObject({ started: true, sessionId: "6bb0b0be-5c8a-4e41-a8bd-5485304c7e02" });
    expect(values.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ consentType: "identity_document", source: "aws_face_liveness" }),
      expect.objectContaining({ consentType: "identity_biometric", source: "aws_face_liveness" }),
    ]));
    expect(values.mock.invocationCallOrder[0]).toBeLessThan(mockedCreateSession.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER);
    expect(db.update).toHaveBeenCalledTimes(2);
  });
});
