import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const associateContext = { user: { id: 44, name: "Associate", email: "associate@example.test", role: "user" }, req: { headers: {} }, res: {} };
const terminal = (result: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) });

describe("associate.updateLead", () => {
  it("updates the status only for a lead owned by an active Associate", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const activityValues = vi.fn().mockResolvedValue(undefined);
    const select = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ role: "associate" }]) })) }).mockReturnValueOnce(terminal([{ id: 7, associateUserId: 44, status: "new", notes: null }]));
    mockedGetDb.mockResolvedValue({ select, update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })), insert: vi.fn(() => ({ values: activityValues })) } as never);

    await expect(appRouter.createCaller(associateContext as never).associate.updateLead({ id: 7, status: "contacted" })).resolves.toEqual({ success: true });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(activityValues).toHaveBeenCalledWith({ associateUserId: 44, leadId: 7, eventType: "status_updated", status: "contacted" });
  });

  it("rejects a lead status update when the lead belongs to another Associate", async () => {
    const update = vi.fn();
    const select = vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ role: "associate" }]) })) }).mockReturnValueOnce(terminal([{ id: 8, associateUserId: 52, status: "new", notes: null }]));
    mockedGetDb.mockResolvedValue({ select, update } as never);

    await expect(appRouter.createCaller(associateContext as never).associate.updateLead({ id: 8, status: "closed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects likely payment-card content before a private Associate lead note is stored", async () => {
    mockedGetDb.mockResolvedValue({} as never);

    await expect(appRouter.createCaller(associateContext as never).associate.createLead({ contactName: "Consenting contact", contactEmail: "contact@example.test", interestType: "general", consentToContact: true, notes: "Card number is 4111 1111 1111 1111" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
