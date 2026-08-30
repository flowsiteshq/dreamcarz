import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(), listLLMModels: vi.fn() }));

import { getDb } from "./db";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { appRouter } from "./routers";

const mockedGetDb = vi.mocked(getDb);
const mockedInvokeLLM = vi.mocked(invokeLLM);
const mockedListLLMModels = vi.mocked(listLLMModels);
const terminal = (result: unknown) => ({ from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) })), where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })) })) })) });
const memberContext = { user: { id: 77, name: "Member", email: "member@example.com", role: "user" }, req: { headers: {}, ip: "203.0.113.10" }, res: {} };

describe("DreamCarz live-data concierge", () => {
  beforeEach(() => {
    mockedGetDb.mockReset();
    mockedInvokeLLM.mockReset();
    mockedListLLMModels.mockReset();
  });

  it("uses only safe account status and confirmed inventory context, then returns allowlisted actions", async () => {
    const select = vi.fn()
      .mockReturnValueOnce(terminal([{ planName: "Entry", status: "active", endsAt: null }]))
      .mockReturnValueOnce(terminal([{ transactionType: "rental", vehicleName: "2024 Chevrolet Malibu", status: "active_rental", currentStep: "active", agreementStatus: "signed", paymentStatus: "authorized", pickupStatus: "verified", returnStatus: "not_started", settlementStatus: "not_started", updatedAt: new Date() }]));
    mockedGetDb.mockResolvedValue({ select } as never);
    mockedListLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] } as never);
    mockedInvokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ answer: "Your current rental is active. Use My Records to review its next required step.", actionIds: ["transactions", "support"] }) } }] } as never);

    const result = await appRouter.createCaller(memberContext as never).concierge.guide({ question: "What should I do with my current rental?" });

    expect(result).toEqual({ answer: "Your current rental is active. Use My Records to review its next required step.", actions: [{ label: "My Records", href: "/dashboard/transactions" }, { label: "Support", href: "/dashboard/support" }], source: "live_guidance" });
    const transactionSelection = select.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(transactionSelection).not.toHaveProperty("contactName");
    expect(transactionSelection).not.toHaveProperty("contactEmail");
    expect(transactionSelection).not.toHaveProperty("paymentProviderTransactionId");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("uses a non-provider fallback without storing or exposing customer records when the database is unavailable", async () => {
    mockedGetDb.mockResolvedValue(null);
    const result = await appRouter.createCaller(memberContext as never).concierge.guide({ question: "Can you help me?" });
    expect(result.source).toBe("fallback");
    expect(result.actions).toEqual([{ label: "My Records", href: "/dashboard/transactions" }, { label: "Support", href: "/dashboard/support" }]);
    expect(mockedInvokeLLM).not.toHaveBeenCalled();
  });
});
