import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const adminContext = { user: { id: 12, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

function queryResult(rows: unknown[]) {
  const result = Promise.resolve(rows);
  return {
    from: () => ({
      where: () => Object.assign(result, { limit: async () => rows }),
    }),
  };
}

function makeDb(selectResults: unknown[][]) {
  return {
    select: vi.fn(() => queryResult(selectResults.shift() ?? [])),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
  };
}

function readyRental(overrides: Record<string, unknown> = {}) {
  return {
    id: 77,
    reference: "DCR-2026-RELEASE",
    status: "agreement_pending",
    transactionType: "rental",
    currentStep: "agreement",
    identityStatus: "verified",
    licenseStatus: "verified",
    eligibilityStatus: "cleared",
    insuranceStatus: "verified",
    paymentStatus: "authorized",
    agreementStatus: "signed",
    insuranceDetails: JSON.stringify({ coverageExpiresOn: "2099-12-31" }),
    ...overrides,
  };
}

describe("DreamCarz vehicle release gate", () => {
  it("blocks release before any update when a required verification or agreement status is incomplete", async () => {
    const db = makeDb([[readyRental({ identityStatus: "manual_review" })]]);
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: "DCR-2026-RELEASE", nextStatus: "ready_for_pickup" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("blocks rental release when the recorded insurance coverage is absent or expired", async () => {
    const db = makeDb([[readyRental({ insuranceDetails: JSON.stringify({ coverageExpiresOn: "2020-01-01" }) })]]);
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: "DCR-2026-RELEASE", nextStatus: "ready_for_pickup" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("blocks rental release when an added driver has not completed identity and license review", async () => {
    const db = makeDb([[readyRental()], [{ identityStatus: "verified", licenseStatus: "pending" }]]);
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: "DCR-2026-RELEASE", nextStatus: "ready_for_pickup" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("records the release status only when all required manual statuses, insurance, agreement, and added-driver conditions are satisfied", async () => {
    const db = makeDb([[readyRental()], []]);
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: "DCR-2026-RELEASE", nextStatus: "ready_for_pickup" })).resolves.toEqual({ success: true });

    expect(db.update).toHaveBeenCalledOnce();
    expect(db.insert).toHaveBeenCalledOnce();
  });
});
