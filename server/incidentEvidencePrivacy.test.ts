import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import { storageGetSignedUrl } from "./storage";

const mockedGetDb = vi.mocked(getDb);
const mockedStorageGetSignedUrl = vi.mocked(storageGetSignedUrl);
const customerContext = { user: { id: 7, name: "Customer", email: "customer@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.31" }, res: {} };

describe("DreamCarz incident evidence privacy", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedStorageGetSignedUrl.mockReset();
  });

  it("returns an evidence indicator instead of a photo storage key in customer incident lists", async () => {
    const selectedFields: unknown[] = [];
    const db = {
      select: vi.fn((fields: unknown) => {
        selectedFields.push(fields);
        return { from: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: () => ({ orderBy: () => [] }) }) }) }) };
      }),
    };
    mockedGetDb.mockResolvedValue(db as never);

    await appRouter.createCaller(customerContext as never).incidents.listMine();

    expect(selectedFields[0]).toMatchObject({ hasEvidence: expect.anything() });
    expect(selectedFields[0]).not.toHaveProperty("photoKeys");
  });

  it("opens only account-owned evidence through a signed URL and audits the requested index", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn(() => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => [{ id: 41, transactionId: 52, photoKeys: JSON.stringify(["private/incident/one.jpg"]) }] }) }) }) })),
      insert: vi.fn(() => ({ values })),
    };
    mockedGetDb.mockResolvedValue(db as never);
    mockedStorageGetSignedUrl.mockResolvedValue("https://secure.example/incident-evidence" as never);

    const response = await appRouter.createCaller(customerContext as never).incidents.openEvidence({ incidentId: 41 });

    expect(response).toEqual({ url: "https://secure.example/incident-evidence" });
    expect(mockedStorageGetSignedUrl).toHaveBeenCalledWith("private/incident/one.jpg");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 52, eventType: "incident.evidence_access_requested", metadata: JSON.stringify({ incidentId: 41, evidenceIndex: 0 }) }));
  });
});
