import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { storagePut } from "./storage";
import { verifyCoCardCheckoutReturn } from "./paymentProvider";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedStoragePut = vi.mocked(storagePut);
const mockedVerifyCoCardCheckoutReturn = vi.mocked(verifyCoCardCheckoutReturn);
const customerContext = {
  user: { id: 77, name: "Transaction Customer", email: "customer@example.com", role: "user" },
  req: { headers: {} },
  res: {},
};

describe("transaction intake router", () => {
  beforeEach(() => { mockedGetDb.mockReset(); mockedStoragePut.mockReset(); mockedVerifyCoCardCheckoutReturn.mockReset(); });

  it("rejects a Coming Soon or unsupported vehicle before creating a transaction", async () => {
    mockedGetDb.mockResolvedValue({} as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.begin({
      transactionType: "rental",
      vehicleId: "coming-soon-2024-tesla-model-3",
    })).rejects.toThrow("Select a confirmed DreamCarz inventory vehicle");
  });

  it("requires an account-bound transaction reference before profile details can be saved", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.transactions.saveProfile({
      reference: "DCR-2026-UNKNOWN",
      fullName: "Transaction Customer",
      phone: "3015550100",
      addressLine1: "10001 Derekwood Lane",
      city: "Lanham",
      state: "MD",
      postalCode: "20706",
      dateOfBirth: "1990-01-01",
    })).rejects.toThrow();
  });

  it("blocks customers from issuing an approved versioned transaction quote", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.createTransactionQuote({
      reference: "DCR-2026-QUOTE",
      lines: [{ lineType: "base_rental", label: "Verified rental charge", amountCents: 10000, isConditional: false }],
    })).rejects.toThrow("Administrator access is required");
  });

  it("blocks driver-license capture until the customer gives explicit identity-document consent", async () => {
    const transaction = { id: 41, status: "verification_pending" as const, licenseStatus: "not_started" as const };
    mockedGetDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })),
        })),
      })),
    } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.uploadIdentityDocument({
      reference: "DCR-2026-CONSENT",
      documentType: "license_front",
      filename: "license.jpg",
      contentType: "image/jpeg",
      base64: "A".repeat(100),
    })).rejects.toThrow("Explicit identity-document consent is required");
  });

  it("requires explicit financing authorization before accepting a purchase finance path", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.transactions.savePurchasePaymentPath({
      reference: "DCP-2026-FINANCE",
      paymentPath: "finance",
    })).rejects.toThrow("Explicit authorization is required");
  });

  it("requires a description before accepting a claimed trade-in", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.transactions.saveTradeIn({
      reference: "DCP-2026-TRADEIN",
      hasTradeIn: true,
    })).rejects.toThrow("Describe the trade-in vehicle");
  });

  it("blocks incident reports that are not attached to the customer’s current rental", async () => {
    const transaction = { id: 82, transactionType: "purchase" as const, status: "active_rental" as const, vehicleId: "2024-chevrolet-malibu-gray" };
    mockedGetDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })),
    } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.incidents.report({
      transactionReference: "DCP-2026-NOT-RENTAL",
      incidentType: "damage",
      severity: "standard",
      description: "Observed damage that needs a DreamCarz review.",
      photos: [],
    })).rejects.toThrow("active or current rental");
  });

  it("routes an account-owned identity-record deletion request to manual review and creates a privacy audit event", async () => {
    const transaction = { id: 99, status: "verification_pending" as const };
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.requestIdentityRecordDeletion({ reference: "DCR-2026-PRIVACY", reason: "I no longer need this application." })).resolves.toMatchObject({ success: true, status: "manual_review" });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ eventType: "privacy.identity_record_deletion_requested", toStatus: "manual_review" }));
  });

  it("blocks customers from creating an approved native agreement template", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.transactions.createAgreementTemplate({
      agreementType: "rental",
      version: "rental-2026.1",
      title: "DreamCarz Rental Agreement",
      content: "Approved controlled agreement content that is long enough for validation.",
      legalApprovalReference: "Counsel reference 2026-01",
      legallyApproved: true,
      activate: true,
    })).rejects.toThrow("Administrator access is required");
  });

  it("requires explicit acknowledgement and electronic-signature consent before native signing", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.transactions.signNativeAgreement({
      reference: "DCR-2026-SIGNATURE",
      agreementId: 1,
      signerName: "Transaction Customer",
      acknowledgesAgreement: false,
      electronicSignatureConsent: false,
    } as never)).rejects.toThrow();
  });

  it("creates an active native template only from an administrator-confirmed legal approval", async () => {
    const adminContext = { ...customerContext, user: { ...customerContext.user, role: "admin" } };
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 28 }]);
    mockedGetDb.mockResolvedValue({ update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: insertValues })) } as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.transactions.createAgreementTemplate({ agreementType: "rental", version: "rental-2026.1", title: "DreamCarz Rental Agreement", content: "Controlled agreement content long enough to satisfy native template validation.", legalApprovalReference: "Counsel memo 2026-01", legallyApproved: true, activate: true })).resolves.toMatchObject({ success: true, templateId: 28 });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ isActive: true, legalApprovalReference: "Counsel memo 2026-01" }));
  });

  it("prepares and signs a native agreement with a private artifact and immutable audit event", async () => {
    const transaction = { id: 19, reference: "DCR-2026-NATIVE", transactionType: "rental" as const, vehicleName: "2024 Chevrolet Malibu", contactName: "Transaction Customer", status: "agreement_pending" as const, currentStep: "review" };
    const template = { id: 4, agreementType: "rental" as const, version: "rental-2026.1", content: "Agreement for {{CUSTOMER_NAME}} and {{VEHICLE_NAME}}, reference {{TRANSACTION_REFERENCE}}.", legalApprovedAt: new Date(), legalApprovalReference: "Counsel memo 2026-01", isActive: true };
    const selectPrepare = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([template]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) });
    const preparedAgreement = { id: 71, transactionId: 19, contentSnapshot: "Agreement for Transaction Customer and 2024 Chevrolet Malibu, reference DCR-2026-NATIVE.", status: "awaiting_signature" as const, agreementType: "rental" as const, version: "rental-2026.1" };
    const selectSign = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([preparedAgreement]) })) })) });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 71 }]);
    const db = { select: selectPrepare, update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: insertValues })) };
    mockedGetDb.mockResolvedValue(db as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.prepareNativeAgreement({ reference: "DCR-2026-NATIVE" })).resolves.toMatchObject({ success: true, agreementId: 71, resumed: false });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ contentSnapshot: expect.stringContaining("Transaction Customer"), signingMethod: "native_attestation" }));

    mockedGetDb.mockResolvedValue({ ...db, select: selectSign } as never);
    mockedStoragePut.mockResolvedValue({ key: "transaction-agreements/77/19/71/native-signed.html", url: "https://storage.example/signed.html" } as never);
    await expect(caller.transactions.signNativeAgreement({ reference: "DCR-2026-NATIVE", agreementId: 71, signerName: "Transaction Customer", acknowledgesAgreement: true, electronicSignatureConsent: true })).resolves.toMatchObject({ success: true });
    expect(mockedStoragePut).toHaveBeenCalledWith(expect.stringContaining("native-signed"), expect.any(Buffer), "text/html");
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ eventType: "agreement.native_signed", toStatus: "manual_review" }));
  });

  it("rejects a CoCard checkout return without the exact one-time DreamCarz checkout attempt", async () => {
    const transaction = { id: 31, reference: "DCR-2026-PAYMENT", currentStep: "payment", cocardCheckoutAttemptToken: "matching-attempt-token-123456", paymentProviderTransactionId: null };
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })) } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.recordCoCardCheckoutReturn({ reference: transaction.reference, checkoutAttemptToken: "different-attempt-token-123456", gatewayTransactionId: "txn_12345" })).rejects.toThrow("does not match the current DreamCarz payment attempt");
    expect(mockedVerifyCoCardCheckoutReturn).not.toHaveBeenCalled();
  });

  it("rejects a verified CoCard gateway transaction that is already linked to another DreamCarz record", async () => {
    const transaction = { id: 31, reference: "DCR-2026-PAYMENT", currentStep: "payment", cocardCheckoutAttemptToken: "matching-attempt-token-123456", paymentProviderTransactionId: null };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 32 }]) })) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.recordCoCardCheckoutReturn({ reference: transaction.reference, checkoutAttemptToken: transaction.cocardCheckoutAttemptToken, gatewayTransactionId: "txn_12345" })).rejects.toThrow("already associated with another DreamCarz request");
    expect(mockedVerifyCoCardCheckoutReturn).not.toHaveBeenCalled();
  });
});
