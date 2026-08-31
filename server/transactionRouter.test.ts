import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { verifyCoCardCheckoutReturn } from "./paymentProvider";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedStorageGetSignedUrl = vi.mocked(storageGetSignedUrl);
const mockedStoragePut = vi.mocked(storagePut);
const mockedVerifyCoCardCheckoutReturn = vi.mocked(verifyCoCardCheckoutReturn);
const customerContext = {
  user: { id: 77, name: "Transaction Customer", email: "customer@example.com", role: "user" },
  req: { headers: {} },
  res: {},
};

describe("transaction intake router", () => {
  beforeEach(() => { mockedGetDb.mockReset(); mockedStorageGetSignedUrl.mockReset(); mockedStoragePut.mockReset(); mockedVerifyCoCardCheckoutReturn.mockReset(); });

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

  it("stores consented proof of insurance as a private pending record only during the insurance stage", async () => {
    const transaction = { id: 43, status: "verification_pending" as const, currentStep: "insurance" as const };
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) }));
    const insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: 904 }]) }));
    const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) }));
    mockedGetDb.mockResolvedValue({ select, insert, update } as never);
    mockedStoragePut.mockResolvedValue({ key: "transaction-documents/77/43/insurance_card_private.pdf", url: "/manus-storage/private" } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.uploadInsuranceDocument({
      reference: "DCR-2026-INSURANCE",
      filename: "insurance-card.pdf",
      contentType: "application/pdf",
      base64: "A".repeat(100),
      insuranceReviewConsent: true,
    })).resolves.toMatchObject({ success: true, documentId: 904, status: "pending" });

    expect(mockedStoragePut).toHaveBeenCalledWith(expect.stringContaining("transaction-documents/77/43/insurance_card_"), expect.any(Buffer), "application/pdf");
    expect(insert).toHaveBeenCalledTimes(3);
  });

  it("blocks proof-of-insurance upload outside the account-owned insurance stage", async () => {
    const transaction = { id: 44, status: "verification_pending" as const, currentStep: "review" as const };
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })) } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.uploadInsuranceDocument({
      reference: "DCR-2026-NOT-INSURANCE",
      filename: "insurance-card.pdf",
      contentType: "application/pdf",
      base64: "A".repeat(100),
      insuranceReviewConsent: true,
    })).rejects.toThrow("Insurance proof can be uploaded when DreamCarz opens the insurance stage");
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

  it("records a complete customer return inspection as submitted for human review and moves the rental to return pending", async () => {
    const transaction = { id: 84, transactionType: "rental" as const, status: "active_rental" as const, currentStep: "active_rental" as const };
    const evidence = ["front", "rear", "driver_side", "passenger_side", "interior", "odometer"].map((view, index) => ({ id: index + 1, view, storageKey: `private/condition/${view}.jpg` }));
    const conditionValues = vi.fn().mockResolvedValue(undefined);
    const eventValues = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(evidence) })) });
    mockedGetDb.mockResolvedValue({
      select,
      insert: vi.fn().mockReturnValueOnce({ values: conditionValues }).mockReturnValueOnce({ values: eventValues }),
      update: vi.fn(() => ({ set: updateSet })),
    } as never);

    await expect(appRouter.createCaller(customerContext as never).transactions.submitConditionReport({ reference: "DCR-2026-RETURN", stage: "return", odometerReading: 12042, fuelLevel: "Full", notes: "Vehicle returned for review." })).resolves.toMatchObject({ success: true });

    expect(conditionValues).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 84, stage: "return", status: "submitted", odometerReading: 12042 }));
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "return_pending", currentStep: "return", conditionStatus: "return_complete" }));
    expect(eventValues).toHaveBeenCalledWith(expect.objectContaining({ eventType: "condition.return_report_submitted", fromStatus: "active_rental", toStatus: "return_pending" }));
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

    await expect(caller.transactions.createAgreementTemplate({ agreementType: "rental", version: "rental-2026.1", title: "DreamCarz Rental Agreement", content: "Controlled agreement content long enough to satisfy native template validation.", jurisdiction: "Maryland", legalApprovalReference: "Counsel memo 2026-01", legalReviewNotes: "Counsel-reviewed Maryland disclosure checklist.", legallyApproved: true, activate: true })).resolves.toMatchObject({ success: true, templateId: 28 });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ isActive: true, jurisdiction: "Maryland", legalApprovalReference: "Counsel memo 2026-01", legalReviewNotes: "Counsel-reviewed Maryland disclosure checklist." }));
  });

  it("returns jurisdiction and counsel-review metadata only through the administrator template list", async () => {
    const adminContext = { ...customerContext, user: { ...customerContext.user, role: "admin" } };
    const templates = [{ id: 28, agreementType: "rental", version: "rental-2026.1", title: "DreamCarz Rental Agreement", jurisdiction: "Maryland", legalReviewNotes: "Counsel-reviewed Maryland disclosure checklist.", isActive: true }];
    mockedGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(templates) })) })) } as never);

    await expect(appRouter.createCaller(adminContext as never).transactions.listAgreementTemplates()).resolves.toEqual(templates);
    await expect(appRouter.createCaller(customerContext as never).transactions.listAgreementTemplates()).rejects.toThrow("Administrator access is required");
  });

  it("records a minimal access audit before returning an account-owned signed agreement link", async () => {
    const signedAgreement = { transactionId: 37, signedDocumentKey: "private/transaction-37/signed-agreement.pdf" };
    const select = vi.fn().mockReturnValueOnce({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([signedAgreement]) })) })),
      })),
    });
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 91 }]);
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values: insertValues })) } as never);
    mockedStorageGetSignedUrl.mockResolvedValue("https://example.invalid/private-record" as never);

    await expect(appRouter.createCaller(customerContext as never).transactions.getRecordLink({ recordType: "agreement", id: 8 })).resolves.toEqual({ url: "https://example.invalid/private-record" });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      transactionId: 37,
      actorUserId: customerContext.user.id,
      actorType: "customer",
      eventType: "record.access_requested",
      metadata: JSON.stringify({ recordType: "agreement" }),
    }));
    expect(JSON.stringify(insertValues.mock.calls)).not.toContain(signedAgreement.signedDocumentKey);
  });

  it("returns an account-owned condition evidence link only after recording a storage-key-free access event", async () => {
    const conditionEvidence = { transactionId: 37, storageKey: "private/transaction-37/condition-return-front.jpg" };
    const select = vi.fn().mockReturnValueOnce({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([conditionEvidence]) })) })),
      })),
    });
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 92 }]);
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values: insertValues })) } as never);
    mockedStorageGetSignedUrl.mockResolvedValue("https://example.invalid/private-condition-record" as never);

    await expect(appRouter.createCaller(customerContext as never).transactions.getRecordLink({ recordType: "condition_evidence", id: 18 })).resolves.toEqual({ url: "https://example.invalid/private-condition-record" });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      transactionId: 37,
      actorUserId: customerContext.user.id,
      actorType: "customer",
      eventType: "record.access_requested",
      metadata: JSON.stringify({ recordType: "condition_evidence" }),
    }));
    expect(JSON.stringify(insertValues.mock.calls)).not.toContain(conditionEvidence.storageKey);
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
    const schedule = { requestedStartAt: new Date("2026-09-01T14:00:00Z"), requestedEndAt: new Date("2026-09-05T14:00:00Z"), pickupMethod: "pickup" as const, pickupLocation: "Lanham", scheduledHandoffAt: null, estimatedArrivalAt: new Date("2026-09-01T13:45:00Z"), handoffStatus: "completed" as const, assignedDriverName: "Private driver name must not leak" };
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
      schedule: { requestedEndAt: new Date("2026-09-05T14:00:00Z"), estimatedArrivalAt: new Date("2026-09-01T13:45:00Z"), handoffStatus: "completed" },
      condition: { pickup: { status: "reviewed" }, return: null },
      settlement: { status: "under_review" },
    });
    expect(JSON.stringify(summary)).not.toContain("provider-transaction-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("provider-authorization-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-key-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-evidence-must-not-leak");
    expect(JSON.stringify(summary)).not.toContain("private-settlement-note");
    expect(JSON.stringify(summary)).not.toContain("Private driver name must not leak");
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

  it("creates a review-gated purchase from an account-owned active rental without pricing or financing claims", async () => {
    const source = {
      id: 401,
      reference: "DCR-2026-RENT-TO-BUY",
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
    const createPurchase = vi.fn().mockResolvedValue([{ insertId: 402 }]);
    const createLink = vi.fn().mockResolvedValue(undefined);
    const createEvents = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn()
      .mockReturnValueOnce({ values: createPurchase })
      .mockReturnValueOnce({ values: createLink })
      .mockReturnValueOnce({ values: createEvents });
    mockedGetDb.mockResolvedValue({ select, insert } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.operations.requestLinkedTransaction({ reference: source.reference, linkType: "rent_to_buy" })).resolves.toMatchObject({ success: true, transactionType: "purchase", reference: expect.stringMatching(/^DCB-/) });
    expect(createPurchase).toHaveBeenCalledWith(expect.objectContaining({ userId: customerContext.user.id, transactionType: "purchase", vehicleId: source.vehicleId, membershipPlan: source.membershipPlan, currentStep: "profile", paymentStatus: "pending" }));
    expect(createLink).toHaveBeenCalledWith(expect.objectContaining({ sourceTransactionId: source.id, targetTransactionId: 402, linkType: "rent_to_buy", requestedByUserId: customerContext.user.id }));
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

  it("records customer handoff acknowledgement only after a released rental is marked arrived", async () => {
    const transaction = {
      id: 621,
      reference: "DCR-2026-HANDOFF",
      transactionType: "rental" as const,
      status: "ready_for_pickup" as const,
      identityStatus: "verified" as const,
      licenseStatus: "verified" as const,
      eligibilityStatus: "cleared" as const,
      insuranceStatus: "verified" as const,
      insuranceDetails: JSON.stringify({ coverageExpiresOn: "2099-12-31" }),
      paymentStatus: "authorized" as const,
      agreementStatus: "signed" as const,
    };
    const schedule = { id: 73, handoffStatus: "arrived" as const, pickupMethod: "delivery" as const };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([schedule]) })) })) });
    const updateSchedule = vi.fn().mockResolvedValue(undefined);
    const updateTransaction = vi.fn().mockResolvedValue(undefined);
    const createEvent = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn()
      .mockReturnValueOnce({ set: vi.fn(() => ({ where: updateSchedule })) })
      .mockReturnValueOnce({ set: vi.fn(() => ({ where: updateTransaction })) });
    const insert = vi.fn().mockReturnValue({ values: createEvent });
    mockedGetDb.mockResolvedValue({ select, update, insert } as never);
    const caller = appRouter.createCaller(customerContext as never);

    await expect(caller.transactions.confirmHandoff({ reference: transaction.reference, acknowledgesHandoff: true })).resolves.toEqual({ success: true, handoffStatus: "customer_verified", pickupStatus: "verified" });
    expect(updateSchedule).toHaveBeenCalled();
    expect(updateTransaction).toHaveBeenCalled();
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ transactionId: transaction.id, actorUserId: customerContext.user.id, actorType: "customer", eventType: "handoff.customer_verified" }));

    const unarrivedSelect = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ ...schedule, handoffStatus: "en_route" }]) })) })) });
    mockedGetDb.mockResolvedValue({ select: unarrivedSelect } as never);
    await expect(caller.transactions.confirmHandoff({ reference: transaction.reference, acknowledgesHandoff: true })).rejects.toThrow("only after DreamCarz marks the pickup or delivery as arrived");
  });

  it("blocks rental release and handoff confirmation until every added driver has separate identity and license review", async () => {
    const transaction = {
      id: 713,
      reference: "DCR-2026-ADDED-DRIVER",
      transactionType: "rental" as const,
      status: "agreement_pending" as const,
      identityStatus: "verified" as const,
      licenseStatus: "verified" as const,
      eligibilityStatus: "cleared" as const,
      insuranceStatus: "verified" as const,
      insuranceDetails: JSON.stringify({ coverageExpiresOn: "2099-12-31" }),
      paymentStatus: "authorized" as const,
      agreementStatus: "signed" as const,
    };
    const pendingDriver = { id: 19, licenseStatus: "pending" as const, identityStatus: "verified" as const };
    const releaseSelect = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([pendingDriver]) })) });
    mockedGetDb.mockResolvedValue({ select: releaseSelect } as never);
    const adminContext = { ...customerContext, user: { ...customerContext.user, role: "admin" } };

    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: transaction.reference, nextStatus: "ready_for_pickup" })).rejects.toThrow("Any added driver must complete separate identity and license review before vehicle release");

    const handoffTransaction = { ...transaction, status: "ready_for_pickup" as const };
    const handoffSelect = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([handoffTransaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([pendingDriver]) })) });
    mockedGetDb.mockResolvedValue({ select: handoffSelect } as never);

    await expect(appRouter.createCaller(customerContext as never).transactions.confirmHandoff({ reference: transaction.reference, acknowledgesHandoff: true })).rejects.toThrow("Any added driver must complete separate identity and license review before handoff confirmation");
  });

  it("blocks rental release and handoff confirmation when the recorded insurance coverage date is missing or expired", async () => {
    const transaction = {
      id: 714,
      reference: "DCR-2026-INSURANCE-DATE",
      transactionType: "rental" as const,
      status: "agreement_pending" as const,
      identityStatus: "verified" as const,
      licenseStatus: "verified" as const,
      eligibilityStatus: "cleared" as const,
      insuranceStatus: "verified" as const,
      paymentStatus: "authorized" as const,
      agreementStatus: "signed" as const,
      insuranceDetails: null,
    };
    const releaseSelect = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) });
    mockedGetDb.mockResolvedValue({ select: releaseSelect } as never);
    const adminContext = { ...customerContext, user: { ...customerContext.user, role: "admin" } };
    await expect(appRouter.createCaller(adminContext as never).operations.updateTransactionStatus({ reference: transaction.reference, nextStatus: "ready_for_pickup" })).rejects.toThrow("future recorded insurance coverage date is required before vehicle release");

    const expiredHandoff = { ...transaction, status: "ready_for_pickup" as const, insuranceDetails: JSON.stringify({ coverageExpiresOn: "2020-01-01" }) };
    const handoffSelect = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([expiredHandoff]) })) })) });
    mockedGetDb.mockResolvedValue({ select: handoffSelect } as never);
    await expect(appRouter.createCaller(customerContext as never).transactions.confirmHandoff({ reference: transaction.reference, acknowledgesHandoff: true })).rejects.toThrow("future recorded insurance coverage date is required before handoff confirmation");
  });

  it("returns a condition evidence-presence indicator instead of private photo storage keys in administrator transaction detail", async () => {
    const ordered = (rows: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(rows) })) })) });
    const limited = (rows: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) });
    const detailRow = { transaction: { id: 830, reference: "DCR-2026-CONDITION", status: "return_pending", paymentProviderTransactionId: "private-provider-transaction", paymentProviderAuthorizationId: "private-provider-authorization", paymentProviderCustomerVaultId: "private-provider-vault", cocardCheckoutAttemptToken: "private-cocard-attempt" }, customerName: "Private Customer", customerEmail: "private@example.test" };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([detailRow]) })) })) })) })
      .mockReturnValueOnce(ordered([{ id: 9, agreementType: "rental", version: "rental-v1", status: "signed", signedDocumentKey: "private-signed-agreement-key", providerEnvelopeId: "private-envelope", signerIpHash: "private-signer-hash" }]))
      .mockReturnValueOnce(ordered([]))
      .mockReturnValueOnce(ordered([]))
      .mockReturnValueOnce(ordered([{ id: 12, stage: "return", status: "submitted", photoKeys: "private-condition-photo-key" }]))
      .mockReturnValueOnce(ordered([]))
      .mockReturnValueOnce(limited([]))
      .mockReturnValueOnce(ordered([]))
      .mockReturnValueOnce(ordered([]));
    mockedGetDb.mockResolvedValue({ select } as never);
    const adminContext = { ...customerContext, user: { ...customerContext.user, role: "admin" } };

    const detail = await appRouter.createCaller(adminContext as never).operations.transactionDetail({ reference: detailRow.transaction.reference });

    expect(detail.conditionReports).toEqual([expect.objectContaining({ id: 12, hasEvidence: true })]);
    expect(JSON.stringify(detail.conditionReports)).not.toContain("private-condition-photo-key");
    expect(detail.conditionReports[0]).not.toHaveProperty("photoKeys");
    const serializedDetail = JSON.stringify(detail);
    for (const restrictedValue of ["private-provider-transaction", "private-provider-authorization", "private-provider-vault", "private-cocard-attempt", "private-signed-agreement-key", "private-envelope", "private-signer-hash"]) {
      expect(serializedDetail).not.toContain(restrictedValue);
    }
    expect(detail.transaction.paymentProviderTransactionId).toBe("redacted");
    expect(detail.agreements[0]).toMatchObject({ signedDocumentKey: "redacted", hasSignedDocument: true, hasProviderEnvelope: true, hasSignerAudit: true });
  });

  it("records a minimal administrator audit event before returning a secure transaction record link", async () => {
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 910 }]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ key: "private-document-storage-key" }]) })) })) });
    const auditValues = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values: auditValues })) } as never);
    mockedStorageGetSignedUrl.mockResolvedValue("https://example.test/private-record" as never);
    const adminContext = { ...customerContext, user: { ...customerContext.user, id: 1, role: "admin" } };

    await expect(appRouter.createCaller(adminContext as never).operations.getTransactionRecordLink({ transactionId: 910, source: "document", recordId: 44 })).resolves.toEqual({ url: "https://example.test/private-record" });
    expect(auditValues).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 910, actorUserId: 1, actorType: "admin", eventType: "secure_record.access_requested" }));
    expect(JSON.stringify(auditValues.mock.calls)).not.toContain("private-document-storage-key");
  });
});
