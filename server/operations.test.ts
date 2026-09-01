import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./paymentProvider", async importOriginal => ({ ...(await importOriginal<typeof import("./paymentProvider")>()), getPaymentProviderStatus: vi.fn() }));
vi.mock("./awsFaceLiveness", async importOriginal => ({ ...(await importOriginal<typeof import("./awsFaceLiveness")>()), getAwsFaceLivenessStatus: vi.fn() }));

import { getAwsFaceLivenessStatus } from "./awsFaceLiveness";
import { getDb } from "./db";
import { getPaymentProviderStatus } from "./paymentProvider";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedPaymentStatus = vi.mocked(getPaymentProviderStatus);
const mockedLivenessStatus = vi.mocked(getAwsFaceLivenessStatus);
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.40" }, res: {} };

describe("operations access control", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedPaymentStatus.mockReset();
    mockedLivenessStatus.mockReset();
  });

  it("rejects member access before any operational data is queried", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 22,
        openId: "member-only",
        name: "Member",
        email: "member@example.com",
        loginMethod: "direct",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} },
      res: {},
    } as never);

    await expect(caller.operations.getQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.launchReadiness()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps full identity verification blocked when only Face Liveness is configured", async () => {
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([{ status: "manual_review", paymentStatus: "pending", identityStatus: "manual_review", agreementStatus: "draft" }]) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    mockedPaymentStatus.mockReturnValue({ configured: false } as never);
    mockedLivenessStatus.mockReturnValue({ configured: true, enabled: true, serverCredentialsConfigured: true, browserCredentialBrokerConfigured: true, browserFlowEnabled: true } as never);

    const result = await appRouter.createCaller(adminContext as never).operations.launchReadiness();

    expect(result.checks.find(check => check.key === "identity")).toMatchObject({
      state: "blocker",
      detail: expect.stringContaining("liveness only"),
    });
  });
});
