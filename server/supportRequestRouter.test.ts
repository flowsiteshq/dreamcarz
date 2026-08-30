import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const callerContext = { user: { id: 51, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "198.51.100.42" }, res: {} };
const selectResult = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue(result) })) })) });

describe("DreamCarz support requests", () => {
  beforeEach(() => mockedGetDb.mockReset());

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
});
