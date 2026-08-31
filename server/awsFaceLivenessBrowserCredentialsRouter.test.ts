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

import { createAwsFaceLivenessBrowserCredentials, getAwsFaceLivenessStatus } from "./awsFaceLiveness";
import { getDb } from "./db";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedCreateCredentials = vi.mocked(createAwsFaceLivenessBrowserCredentials);
const mockedProviderStatus = vi.mocked(getAwsFaceLivenessStatus);
const mockedConsumeRateLimit = vi.mocked(consumeRateLimit);
const mockedRateLimitKey = vi.mocked(rateLimitKey);
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };
const provider = { provider: "aws_face_liveness" as const, region: "us-east-1", serverCredentialsConfigured: true, browserCredentialBrokerConfigured: true, browserFlowEnabled: true, enabled: true, configured: true, mode: "ready" as const };

function ownedIdentityTransaction() {
  return { id: 41, reference: "DCR-2026-LIVE", userId: 77, currentStep: "identity", identityStatus: "not_started" };
}

function databaseForTransaction(transaction = ownedIdentityTransaction()) {
  const values = vi.fn().mockResolvedValue(undefined);
  return {
    values,
    db: {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })),
      insert: vi.fn(() => ({ values })),
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

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE", identityDocumentConsent: true, biometricConsent: true })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(mockedRateLimitKey).toHaveBeenCalledWith(memberContext.req, "aws_face_liveness_browser_credentials", "77");
    expect(mockedGetDb).not.toHaveBeenCalled();
    expect(mockedCreateCredentials).not.toHaveBeenCalled();
  });

  it("does not issue credentials when the IAM setup remains in manual-review mode", async () => {
    const { db } = databaseForTransaction();
    mockedGetDb.mockResolvedValue(db as never);
    mockedProviderStatus.mockReturnValue({ ...provider, browserFlowEnabled: false, configured: false, mode: "manual_review" });

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE", identityDocumentConsent: true, biometricConsent: true })).resolves.toMatchObject({ granted: false, provider: { mode: "manual_review" } });

    expect(mockedCreateCredentials).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not issue credentials when an account-owned pending identity transaction is unavailable", async () => {
    const { db } = databaseForTransaction(undefined as never);
    db.select.mockReturnValue({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) });
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-OTHER", identityDocumentConsent: true, biometricConsent: true })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(mockedCreateCredentials).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("records consent before issuing a temporary scoped credential and audits no credential material", async () => {
    const { db, values } = databaseForTransaction();
    mockedGetDb.mockResolvedValue(db as never);
    mockedCreateCredentials.mockResolvedValue({
      configured: true,
      provider,
      credentials: { accessKeyId: "temporary-access-key", secretAccessKey: "temporary-secret", sessionToken: "temporary-token", expiration: new Date("2026-09-01T00:00:00.000Z") },
    });

    const result = await appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE", identityDocumentConsent: true, biometricConsent: true });

    expect(result).toMatchObject({ granted: true, credentials: { accessKeyId: "temporary-access-key", sessionToken: "temporary-token" } });
    expect(values).toHaveBeenCalledTimes(2);
    expect(values.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({ transactionId: 41, userId: 77, consentType: "identity_document", source: "aws_face_liveness_browser_broker" }),
      expect.objectContaining({ transactionId: 41, userId: 77, consentType: "identity_biometric", source: "aws_face_liveness_browser_broker" }),
    ]);
    const auditEvent = values.mock.calls[1]?.[0] as { metadata?: string };
    expect(auditEvent.metadata).toContain("start_face_liveness_only");
    expect(auditEvent.metadata).not.toContain("temporary-access-key");
    expect(auditEvent.metadata).not.toContain("temporary-token");
    expect(auditEvent.metadata).not.toContain("temporary-secret");
  });

  it("records consent but does not create an issuance audit event when the provider rejects the role assumption", async () => {
    const { db, values } = databaseForTransaction();
    mockedGetDb.mockResolvedValue(db as never);
    mockedCreateCredentials.mockRejectedValue(new Error("AssumeRole denied"));

    await expect(appRouter.createCaller(memberContext as never).transactions.requestAwsFaceLivenessBrowserCredentials({ reference: "DCR-2026-LIVE", identityDocumentConsent: true, biometricConsent: true })).rejects.toThrow("AssumeRole denied");

    expect(values).toHaveBeenCalledTimes(1);
    expect(values.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ consentType: "identity_biometric", source: "aws_face_liveness_browser_broker" }),
    ]));
  });
});
