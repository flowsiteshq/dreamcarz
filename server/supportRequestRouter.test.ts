import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { resetRateLimitsForTests } from "./rateLimit";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const callerContext = { user: { id: 51, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "198.51.100.42" }, res: {} };
const selectResult = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(result) })) })) });
const selectLimitResult = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });

describe("DreamCarz support requests", () => {
  beforeEach(() => mockedGetDb.mockReset());
  afterEach(() => resetRateLimitsForTests());

  it("records an account-owned private support request and an immutable submitted event", async () => {
    const requestValues = vi.fn().mockResolvedValue([{ insertId: 44 }]);
    const eventValues = vi.fn().mockResolvedValue([{ insertId: 45 }]);
    const insert = vi.fn().mockReturnValueOnce({ values: requestValues }).mockReturnValueOnce({ values: eventValues });
    mockedGetDb.mockResolvedValue({ insert } as never);

    const result = await appRouter.createCaller(callerContext as never).supportRequests.create({ category: "transaction", urgency: "standard", subject: "Need help with next step", description: "Please explain which private transaction step needs my attention." });

    expect(result.success).toBe(true);
    expect(result.reference).toMatch(/^SP-\d{4}-[A-Z0-9_-]{7}$/);
    expect(requestValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 51, category: "transaction", relatedTransactionId: null }));
    expect(eventValues).toHaveBeenCalledWith(expect.objectContaining({ supportRequestId: 44, actorUserId: 51, eventType: "support_request.submitted", toStatus: "submitted" }));
  });

  it("rejects likely payment-card numbers, passwords, and driver-license numbers before a customer support message is stored", async () => {
    const caller = appRouter.createCaller(callerContext as never);
    await expect(caller.supportRequests.create({ category: "payment", urgency: "standard", subject: "Payment detail", description: "My card number is 4111 1111 1111 1111 and needs review." })).rejects.toThrow("remove payment-card numbers");
    await expect(caller.supportRequests.create({ category: "account", urgency: "standard", subject: "Sign-in detail", description: "My password: secret-value cannot complete the sign-in process." })).rejects.toThrow("remove payment-card numbers");
    await expect(caller.supportRequests.addFollowUp({ supportRequestId: 44, message: "My driver license number: A1234567 is attached to the request." })).rejects.toThrow("remove payment-card numbers");
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("returns member support history without internal notes or assignment information", async () => {
    const select = vi.fn()
      .mockReturnValueOnce(selectResult([{ id: 44, reference: "SP-2026-TEST123", userId: 51, category: "general", urgency: "standard", status: "under_review", subject: "Question", description: "A member question", relatedTransactionId: null, assignedToUserId: 7, customerUpdate: "A private update", internalNote: "Staff-only", createdAt: new Date(), updatedAt: new Date(), resolvedAt: null }]))
      .mockReturnValueOnce(selectResult([{ id: 99, supportRequestId: 44, eventType: "support_request.reviewed", fromStatus: "submitted", toStatus: "under_review", customerUpdate: "A private update", internalNote: "Staff-only", createdAt: new Date() }]));
    mockedGetDb.mockResolvedValue({ select } as never);

    const [result] = await appRouter.createCaller(callerContext as never).supportRequests.listMine();

    expect(result).toMatchObject({ id: 44, reference: "SP-2026-TEST123", customerUpdate: "A private update" });
    expect(result).not.toHaveProperty("internalNote");
    expect(result).not.toHaveProperty("assignedToUserId");
    expect(result.history[0]).not.toHaveProperty("internalNote");
  });

  it("blocks ordinary members from the support operations queue", async () => {
    const select = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) });
    mockedGetDb.mockResolvedValue({ select } as never);
    await expect(appRouter.createCaller(callerContext as never).supportRequests.queue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns customer follow-ups only in the authorized support queue", async () => {
    const staffContext = { ...callerContext, user: { ...callerContext.user, id: 8, role: "user" } };
    const whereResult = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(result) })) });
    const requests = [{ id: 44, reference: "SP-2026-TEST123", userId: 51, category: "general", urgency: "standard", status: "under_review", subject: "Question", description: "A member question", createdAt: new Date(), updatedAt: new Date() }];
    const select = vi.fn()
      .mockReturnValueOnce(whereResult([{ role: "support" }]))
      .mockReturnValueOnce({ from: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(requests) })) })
      .mockReturnValueOnce(selectResult([{ id: 99, supportRequestId: 44, customerUpdate: "Customer-only follow-up detail", createdAt: new Date() }]));
    mockedGetDb.mockResolvedValue({ select } as never);

    const [result] = await appRouter.createCaller(staffContext as never).supportRequests.queue();
    expect(result.customerFollowUps).toEqual([expect.objectContaining({ message: "Customer-only follow-up detail" })]);
    expect(result).not.toHaveProperty("internalNote");
  });

  it("records a private follow-up only for an account-owned open support request", async () => {
    const eventValues = vi.fn().mockResolvedValue(undefined);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn().mockReturnValueOnce(selectLimitResult([{ id: 44, status: "under_review" }])),
      insert: vi.fn(() => ({ values: eventValues })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
    };
    mockedGetDb.mockResolvedValue(db as never);

    await expect(appRouter.createCaller(callerContext as never).supportRequests.addFollowUp({ supportRequestId: 44, message: "I have additional details for the DreamCarz support review." })).resolves.toEqual({ success: true });
    expect(eventValues).toHaveBeenCalledWith(expect.objectContaining({ supportRequestId: 44, actorUserId: 51, eventType: "support_request.customer_follow_up", fromStatus: "under_review", toStatus: "under_review" }));
    expect(updateWhere).toHaveBeenCalled();
  });

  it("does not allow a customer follow-up on a closed or unavailable support request", async () => {
    mockedGetDb.mockResolvedValue({ select: vi.fn().mockReturnValueOnce(selectLimitResult([{ id: 44, status: "closed" }])) } as never);
    await expect(appRouter.createCaller(callerContext as never).supportRequests.addFollowUp({ supportRequestId: 44, message: "I have additional details for the DreamCarz support review." })).rejects.toThrow("only while this support request is open");
  });
});
