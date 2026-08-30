import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const customerContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {} }, res: {} };
const adminContext = { user: { id: 1, name: "Administrator", email: "admin@example.com", role: "admin" }, req: { headers: {} }, res: {} };

describe("DreamCarz OS foundation router", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("does not allow a customer to create a membership plan", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.memberships.createPlan({ code: "ENTRY", name: "Entry", activate: false })).rejects.toThrow("Administrator access is required");
  });

  it("records a membership plan only through an administrator and preserves its inactive default", async () => {
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 18 }]);
    mockedGetDb.mockResolvedValue({ insert: vi.fn(() => ({ values: insertValues })) } as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.memberships.createPlan({ code: "ENTRY", name: "Entry access", description: "Approved operational membership", activate: false })).resolves.toEqual({ success: true, planId: 18 });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ isActive: false, code: "ENTRY" }));
  });

  it("does not allow a customer to write an auditable wallet ledger entry", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.wallet.recordEntry({ userId: 77, entryType: "credit", amountCents: 500, description: "Manual test credit" })).rejects.toThrow("Administrator access is required");
  });

  it("does not allow a customer to create a Vehicle Passport", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.vehiclePassports.save({
      vehicleId: "2024-chevrolet-malibu-gray",
      vehicleName: "2024 Chevrolet Malibu · Gray",
      acquisitionStatus: "owned",
      readinessStatus: "available",
    })).rejects.toThrow("Administrator access is required");
  });

  it("does not allow a customer to access the fleet-incident review queue", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.fleetIncidents.list()).rejects.toThrow("Administrator access is required");
  });

  it("does not allow a customer to access the Command Center aggregate", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.commandCenter()).rejects.toThrow("Administrator access is required");
  });

  it("does not allow a customer to create controlled smart-pricing rules", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.pricingRules.create({
      name: "Delivery pilot",
      scope: "delivery",
      configuration: '{"description":"A controlled proposal"}',
    })).rejects.toThrow("Administrator access is required");
  });

  it("does not allow a customer to update an operational pickup or delivery handoff", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.handoff.update({ reference: "DCR-2026-HANDOFF", handoffStatus: "scheduled" })).rejects.toThrow("Administrator access is required.");
  });

  it("does not allow a customer to create a reviewed return adjustment", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.operations.settlements.addAdjustment({ reference: "DCR-2026-RETURN", adjustmentType: "toll", amountCents: 2500, description: "Reviewed toll record" })).rejects.toThrow("Administrator access is required.");
  });

  it("does not allow a customer without an assigned partner role to access Fleet Partner operations", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.fleetPartner.overview()).rejects.toThrow("Fleet Partner access is required");
  });

  it("does not allow a customer to submit Fleet Partner inspection, maintenance, or incident records", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.fleetPartner.submitInspection({ vehiclePassportId: 1 })).rejects.toThrow("Fleet Partner access is required");
    await expect(caller.fleetPartner.requestMaintenance({ vehiclePassportId: 1, maintenanceType: "repair", notes: "Needs review" })).rejects.toThrow("Fleet Partner access is required");
    await expect(caller.fleetPartner.reportIncident({ vehiclePassportId: 1, incidentType: "mechanical", severity: "standard", description: "A mechanical issue needs operations review." })).rejects.toThrow("Fleet Partner access is required");
  });

  it("does not allow a customer without an assigned Associate role to access referral or lead operations", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.associate.overview()).rejects.toThrow("Associate access is required");
    await expect(caller.associate.createLead({ contactName: "Consented Contact", contactEmail: "contact@example.test", interestType: "rental", consentToContact: true })).rejects.toThrow("Associate access is required");
  });

  it("does not allow a customer to issue a private notification to another account", async () => {
    const caller = appRouter.createCaller(customerContext as never);
    await expect(caller.communications.issueInApp({
      userId: 78,
      category: "transaction",
      title: "Transaction update",
      body: "A private record was updated.",
      actionPath: "/dashboard/transactions",
    })).rejects.toThrow("Administrator access is required");
  });

  it("records a wallet credit with an administrator-owned, pending ledger event rather than a silent balance edit", async () => {
    const account = { id: 9, userId: 77 };
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([account]) })) })) }));
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    mockedGetDb.mockResolvedValue({ select, insert: vi.fn(() => ({ values: insertValues })) } as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.wallet.recordEntry({ userId: 77, entryType: "credit", amountCents: 500, description: "Approved adjustment" })).resolves.toMatchObject({ success: true, reference: expect.stringMatching(/^DCW-/) });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ walletAccountId: 9, status: "pending", amountCents: 500, createdByUserId: 1 }));
  });

  it("records an administrator eligibility decision on the transaction assessment and audit trail", async () => {
    const transaction = { id: 41, eligibilityStatus: "pending" as const };
    const assessment = { id: 7, ruleSnapshot: '{"version":"dreamcarz-eligibility-v1"}' };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([assessment]) })) })) });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    mockedGetDb.mockResolvedValue({ select, update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: insertValues })) } as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.reviewEligibility({ reference: "DCR-2026-ELIGIBILITY", status: "cleared", decisionReason: "Required records were reviewed." })).resolves.toEqual({ success: true, eligibilityStatus: "cleared" });
    expect(updateWhere).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ eventType: "eligibility.review_recorded", toStatus: "cleared" }));
  });

  it("limits eligibility policy creation to administrators and records unseeded policies as drafts", async () => {
    const customerCaller = appRouter.createCaller(customerContext as never);
    await expect(customerCaller.operations.eligibilityPolicies.create({ code: "RENTAL-MD", name: "Rental review", version: "2026.1", scope: "all_rentals", ruleConfiguration: '{"requiredChecks":["license_validity"]}' })).rejects.toThrow("Administrator access is required");

    const insertValues = vi.fn().mockResolvedValue([{ insertId: 94 }]);
    mockedGetDb.mockResolvedValue({ insert: vi.fn(() => ({ values: insertValues })) } as never);
    const adminCaller = appRouter.createCaller(adminContext as never);
    await expect(adminCaller.operations.eligibilityPolicies.create({ code: "RENTAL-MD", name: "Rental review", version: "2026.1", scope: "all_rentals", ruleConfiguration: '{"requiredChecks":["license_validity"]}' })).resolves.toEqual({ success: true, eligibilityPolicyId: 94 });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ code: "RENTAL-MD", createdByUserId: adminContext.user.id }));
  });

  it("snapshots an active administrator-selected policy during manual eligibility review without automatic approval", async () => {
    const transaction = { id: 91, eligibilityStatus: "pending" as const, vehicleId: "2024-chevrolet-malibu-gray" };
    const policy = { id: 14, code: "RENTAL-MD", name: "Rental review", version: "2026.1", status: "active" as const, scope: "all_rentals" as const, vehicleId: null, approvalReference: "POLICY-14", ruleConfiguration: '{"requiredChecks":["license_validity"]}' };
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([transaction]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([policy]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    mockedGetDb.mockResolvedValue({ select, update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: insertValues })) } as never);
    const caller = appRouter.createCaller(adminContext as never);

    await expect(caller.operations.reviewEligibility({ reference: "DCR-2026-POLICY", status: "manual_review", decisionReason: "Supporting records require further review.", eligibilityPolicyId: policy.id })).resolves.toEqual({ success: true, eligibilityStatus: "manual_review" });
    const serializedCalls = JSON.stringify(insertValues.mock.calls);
    expect(serializedCalls).toContain("RENTAL-MD");
    expect(serializedCalls).toContain("administrator_review");
    expect(serializedCalls).toContain("manual_review");
  });
});
