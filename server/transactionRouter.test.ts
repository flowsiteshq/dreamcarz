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

  it("requires all six labeled vehicle views before a pickup condition report can be finalized", async () => {
    const transaction = { id: 83, transactionType: "rental" as const, status: "ready_for_pickup" as const };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.submitConditionReport({
      reference: "DCR-2026-CONDITION",
      stage: "pickup",
      odometerReading: 12000,
      fuelLevel: "Full",
    })).rejects.toThrow("required front, rear, driver side, passenger side, interior, odometer condition photo views");
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

  it("returns an account-owned active-rental status summary without provider, document, or customer-profile identifiers", async () => {
    const rental = {
      id: 208,
      reference: "DCR-2026-ACTIVE",
      vehicleName: "2024 Chevrolet Malibu · Gray",
      vehicleImage: "https://assets.example/malibu.png",
      status: "active_rental" as const,
      paymentStatus: "authorized" as const,
      agreementStatus: "signed" as const,
      conditionStatus: "pickup_complete" as const,
      pickupStatus: "completed" as const,
      activeRentalStatus: "active" as const,
      returnStatus: "pending" as const,
      settlementStatus: "pending" as const,
      paymentProviderTransactionId: "provider-transaction-must-not-leak",
      paymentProviderAuthorizationId: "provider-authorization-must-not-leak",
      contactEmail: "customer@example.com",
    };
    const schedule = { requestedStartAt: new Date("2026-09-01T14:00:00Z"), requestedEndAt: new Date("2026-09-05T14:00:00Z"), pickupMethod: "pickup" as const, pickupLocation: "Lanham", scheduledHandoffAt: null, handoffStatus: "completed" as const };
    const agreement = { status: "signed" as const, version: "rental-2026.1", signedAt: new Date("2026-09-01T13:00:00Z"), signedDocumentKey: "private-key-must-not-leak" };
    const pickupCondition = { stage: "pickup" as const, status: "reviewed" as const, updatedAt: new Date("2026-09-01T13:30:00Z"), photoKeys: "private-evidence-must-not-leak" };
    const settlement = { status: "under_review" as const, updatedAt: new Date("2026-09-05T16:00:00Z"), finalAmountCents: 7500, summary: "private-settlement-note" };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([rental]) })) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([schedule]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([agreement]) })) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([pickupCondition]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([settlement]) })) })) });
    mockedGetDb.mockResolvedValue({ select } as never);

    const caller = appRouter.createCaller(customerContext as never);
    const summary = await caller.transactions.activeRentalSummary();

    expect(summary).toMatchObject({
      reference: "DCR-2026-ACTIVE",
      vehicle: { name: "2024 Chevrolet Malibu · Gray" },
      lifecycle: { activeRentalStatus: "active", paymentStatus: "authorized", agreementStatus: "signed" },
      schedule: { requestedEndAt: new Date("2026-09-05T14:00:00Z"), handoffStatus: "completed" },
      condition: { pickup: { status: "reviewed" }, return: null },
      settlement: { status: "under_review" },
    });
    expect(JSON.stringify(summary)).not.toContain("provider-transaction-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("provider-authorization-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-key-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-evidence-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-settlement-note");
    expect(JSON.stringify(summary)).not.toContain("customer@example.com");
  });

  it("returns no active-rental summary when the account has no matching active rental", async () => {
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) })) })) } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.activeRentalSummary()).resolves.toBeNull();
  });

  it("creates a review-gated rental swap request only for an account-owned active rental and confirmed target vehicle", async () => {
    const source = {
      id: 314,
      reference: "DCR-2026-SWAP-SOURCE",
      userId: customerContext.user.id,
      transactionType: "rental" as const,
      status: "active_rental" as const,
      vehicleId: "2024-chevrolet-malibu-gray",
      membershipPlan: "freedom",
      contactName: "Transaction Customer",
      contactEmail: "customer@example.com",
      contactPhone: "3015550100",
      addressLine1: "10001 Derekwood Lane",
      addressLine2: null,
      city: "Lanham",
      state: "MD",
      postalCode: "20706",
      identityStatus: "verified" as const,
      licenseStatus: "verified" as const,
    };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([source]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) });
    const createTarget = vi.fn().mockResolvedValue([{ insertId: 315 }]);
    const createLink = vi.fn().mockResolvedValue(undefined);
    const createEvents = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn()
      .mockReturnValueOnce({ values: createTarget })
      .mockReturnValueOnce({ values: createLink })
      .mockReturnValueOnce({ values: createEvents });
    mockedGetDb.mockResolvedValue({ select, insert } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.operations.requestLinkedTransaction({ reference: source.reference, linkType: "swap", targetVehicleId: "2022-chevrolet-traverse-white" })).resolves.toMatchObject({ success: true, transactionType: "rental" });
    expect(createTarget).toHaveBeenCalledWith(expect.objectContaining({
      userId: customerContext.user.id,
      vehicleId: "2022-chevrolet-traverse-white",
      vehicleName: "2022 Chevrolet Traverse",
      status: "initiated",
      currentStep: "dates",
    }));
    expect(createLink).toHaveBeenCalledWith(expect.objectContaining({ sourceTransactionId: 314, targetTransactionId: 315, linkType: "swap", requestedByUserId: customerContext.user.id }));

    const unknownTargetSelect = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([source]) })) })) });
    mockedGetDb.mockResolvedValue({ select: unknownTargetSelect } as never);
    await expect(caller.operations.requestLinkedTransaction({ reference: source.reference, linkType: "swap", targetVehicleId: "coming-soon-vehicle" })).rejects.toThrow("Choose a confirmed DreamCarz inventory vehicle");
  });

  it("returns a finalized account-owned settlement statement without receipt, evidence, provider, or reviewer identifiers", async () => {
    const transaction = { id: 522, reference: "DCR-2026-STATEMENT", transactionType: "rental" as const, vehicleName: "2020 Chevrolet Equinox", status: "settlement_pending" as const, returnStatus: "complete" as const, settlementStatus: "complete" as const };
    const settlement = { id: 64, status: "settled" as const, currency: "USD", approvedSubtotalCents: 40000, depositAppliedCents: 25000, adjustmentsCents: 1500, finalAmountCents: 16500, summary: "Reviewed return record.", settledAt: new Date("2026-09-08T12:00:00Z"), updatedAt: new Date("2026-09-08T12:00:00Z"), receiptStorageKey: "private-receipt-key", reviewedByUserId: 1 };
    const adjustment = { adjustmentType: "toll" as const, status: "approved" as const, amountCents: 1500, description: "Reviewed toll record.", reviewedAt: new Date("2026-09-08T11:00:00Z"), evidenceStorageKey: "private-evidence-key", reviewedByUserId: 1 };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([settlement]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([adjustment]) })) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    const caller = appRouter.createCaller(customerContext as never);

    const result = await caller.transactions.getSettlementStatement({ reference: transaction.reference });

    expect(result).toMatchObject({ transaction: { reference: transaction.reference, vehicleName: transaction.vehicleName }, statement: { isFinalized: true, status: "settled", finalAmountCents: 16500, adjustments: [{ adjustmentType: "toll", amountCents: 1500 }] } });
    expect(JSON.stringify(result)).not.toContain("private-receipt-key");
    expect(JSON.stringify(result)).not.toContain("private-evidence-key");
    expect(JSON.stringify(result)).not.toContain("reviewedByUserId");
  });

  it("withholds monetary and itemized data while an account-owned return settlement remains under review", async () => {
    const transaction = { id: 523, reference: "DCR-2026-REVIEW", transactionType: "rental" as const, vehicleName: "2020 Chevrolet Traverse", status: "settlement_pending" as const, returnStatus: "inspected" as const, settlementStatus: "pending" as const };
    const settlement = { id: 65, status: "under_review" as const, currency: "USD", approvedSubtotalCents: 40000, depositAppliedCents: 25000, adjustmentsCents: 1500, finalAmountCents: 16500, summary: "Private review note.", updatedAt: new Date("2026-09-08T12:00:00Z") };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([settlement]) })) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    const caller = appRouter.createCaller(customerContext as never);

    const result = await caller.transactions.getSettlementStatement({ reference: transaction.reference });

    expect(result).toEqual({ transaction: { reference: transaction.reference, vehicleName: transaction.vehicleName, status: "settlement_pending", returnStatus: "inspected", settlementStatus: "pending" }, statement: { status: "under_review", updatedAt: settlement.updatedAt, isFinalized: false } });
    expect(JSON.stringify(result)).not.toContain("16500");
    expect(JSON.stringify(result)).not.toContain("Private review note");
  });
});
