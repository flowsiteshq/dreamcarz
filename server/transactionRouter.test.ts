import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const customerContext = {
  user: { id: 77, name: "Transaction Customer", email: "customer@example.com", role: "user" },
  req: { headers: {} },
  res: {},
};

describe("transaction intake router", () => {
  beforeEach(() => mockedGetDb.mockReset());

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
});
