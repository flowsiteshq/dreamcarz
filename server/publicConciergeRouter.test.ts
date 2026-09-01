import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({ consumeRateLimit: vi.fn(() => ({ allowed: true })), rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`) }));
vi.mock("./_core/llm", () => ({ listLLMModels: vi.fn(), invokeLLM: vi.fn() }));

import { invokeLLM, listLLMModels } from "./_core/llm";
import { consumeRateLimit } from "./rateLimit";
import { appRouter } from "./routers";

const guestContext = { req: { headers: {}, ip: "203.0.113.30" }, res: {} };

describe("public DreamCarz concierge", () => {
  beforeEach(() => {
    vi.mocked(invokeLLM).mockReset();
    vi.mocked(listLLMModels).mockReset();
    vi.mocked(consumeRateLimit).mockReset();
    vi.mocked(consumeRateLimit).mockReturnValue({ allowed: true, remaining: 11, retryAfterMs: 0 });
  });

  it("returns only server-approved vehicle recommendations from a structured guidance response", async () => {
    vi.mocked(listLLMModels).mockResolvedValue({ data: [{ id: "gpt-5-mini" }] } as never);
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ answer: "A sedan can be a good starting point.", intent: "rental", vehicleClass: "sedan", nextPrompt: "Which Malibu or Fusion would you like to explore?", recommendedVehicleIds: ["2024-chevrolet-malibu-gray", "2024-ford-fusion-gray"] }) } }] } as never);

    await expect(appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "I need a sedan this week" })).resolves.toMatchObject({ intent: "rental", vehicleClass: "sedan", recommendedVehicleIds: ["2024-chevrolet-malibu-gray", "2024-ford-fusion-gray"], source: "live_guidance" });
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
  });

  it("passes a bounded temporary conversation context to continue guidance without storing it", async () => {
    vi.mocked(listLLMModels).mockResolvedValue({ data: [{ id: "claude-haiku-4-5" }] } as never);
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ answer: "For a family trip, should I focus on space or a sedan?", intent: "rental", vehicleClass: "all", nextPrompt: "Tell me what matters most for the drive.", recommendedVehicleIds: ["2022-chevrolet-traverse-white"] }) } }] } as never);

    await expect(appRouter.createCaller(guestContext as never).concierge.publicGuide({
      question: "I need something for my family",
      conversation: [
        { role: "concierge", text: "Hi. I’m your DreamCarz concierge. What can I help you with today?" },
        { role: "member", text: "I want to rent a vehicle." },
      ],
    })).resolves.toMatchObject({ intent: "rental", source: "live_guidance" });

    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-haiku-4-5",
      messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining("TEMPORARY_CONVERSATION_CONTEXT") })]),
    }));
  });

  it("rejects sensitive input before model invocation", async () => {
    await expect(appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "My card number is 4111 1111 1111 1111" })).rejects.toThrow("For your privacy");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("rejects sensitive temporary conversation context before model invocation", async () => {
    await expect(appRouter.createCaller(guestContext as never).concierge.publicGuide({
      question: "Show me an SUV",
      conversation: [{ role: "member", text: "My email is example@dreamcarz.test" }],
    })).rejects.toThrow("For your privacy");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("caps a model response at the concise 220-character public limit", async () => {
    const longAnswer = "A".repeat(260);
    vi.mocked(listLLMModels).mockResolvedValue({ data: [{ id: "claude-haiku-4-5" }] } as never);
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ answer: longAnswer, intent: "explore", vehicleClass: "all", nextPrompt: "What matters most?", recommendedVehicleIds: [] }) } }] } as never);

    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "I need a vehicle" });

    expect(result.answer).toHaveLength(220);
    expect(result.answer).toBe(longAnswer.slice(0, 220));
  });

  it("blocks public guidance before model invocation when the request rate limit is reached", async () => {
    vi.mocked(consumeRateLimit).mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
    await expect(appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "Show me an SUV" })).rejects.toThrow("Please wait before asking DreamCarz Concierge");
    expect(invokeLLM).not.toHaveBeenCalled();
  });
});
