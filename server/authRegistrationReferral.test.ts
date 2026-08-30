import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./directAuth", () => ({
  createDirectSession: vi.fn(),
  loginDirectAccount: vi.fn(),
  registerDirectAccount: vi.fn(),
  revokeDirectSession: vi.fn(),
  setDirectPasswordForUser: vi.fn(),
}));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { createDirectSession, registerDirectAccount } from "./directAuth";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedRegister = vi.mocked(registerDirectAccount);
const mockedCreateSession = vi.mocked(createDirectSession);

describe("DreamCarz registration referral attribution", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedRegister.mockReset();
    mockedCreateSession.mockReset();
  });

  it("creates a pending immutable referral link only for a validated Associate code at registration", async () => {
    const referralProfile = { userId: 404, referralCode: "DC-PARTNER" };
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([referralProfile]) })) })) }));
    const referralInsert = vi.fn().mockResolvedValueOnce([{ insertId: 88 }]).mockResolvedValueOnce(undefined);
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values: referralInsert })) } as never);
    mockedRegister.mockResolvedValue({ id: 505, name: "New Member", email: "new.member@example.test", loginMethod: "password", role: "user" } as never);
    mockedCreateSession.mockResolvedValue({ token: "session-token" } as never);
    const response = { cookie: vi.fn() };
    const caller = appRouter.createCaller({ user: null, req: { headers: {} }, res: response } as never);

    await expect(caller.auth.register({ name: "New Member", email: "new.member@example.test", password: "DreamCarz!2026", acceptedTerms: true, referralCode: referralProfile.referralCode })).resolves.toMatchObject({ id: 505, email: "new.member@example.test" });
    expect(referralInsert).toHaveBeenCalledWith({ referrerId: referralProfile.userId, referredId: 505, status: "pending" });
    expect(referralInsert).toHaveBeenCalledWith({ referralId: 88, referrerUserId: referralProfile.userId, referredUserId: 505, eventType: "account_registered" });
    expect(response.cookie).toHaveBeenCalled();
  });

  it("rejects an unrecognized referral code before creating an account or referral record", async () => {
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) }));
    mockedGetDb.mockResolvedValue({ select } as never);
    const caller = appRouter.createCaller({ user: null, req: { headers: {} }, res: { cookie: vi.fn() } } as never);

    await expect(caller.auth.register({ name: "New Member", email: "invalid.referral@example.test", password: "DreamCarz!2026", acceptedTerms: true, referralCode: "DC-UNKNOWN" })).rejects.toThrow("Associate referral code is not active");
    expect(mockedRegister).not.toHaveBeenCalled();
  });
});
