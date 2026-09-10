import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({ consumeRateLimit: vi.fn(() => ({ allowed: true })), rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`) }));
vi.mock("./_core/llm", () => ({ listLLMModels: vi.fn(), invokeLLM: vi.fn() }));
vi.mock("./elevenLabsTranscription", () => ({ transcribeConciergeVoice: vi.fn() }));
vi.mock("./elevenLabsVoiceAgent", () => ({ createDreamCarzVoiceSession: vi.fn() }));

import { invokeLLM, listLLMModels } from "./_core/llm";
import { transcribeConciergeVoice } from "./elevenLabsTranscription";
import { createDreamCarzVoiceSession } from "./elevenLabsVoiceAgent";
import { consumeRateLimit } from "./rateLimit";
import { appRouter } from "./routers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const guestContext = { req: { headers: {}, ip: "203.0.113.30" }, res: {} };
const conciergePageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Concierge.tsx"), "utf8");

describe("public DreamCarz concierge", () => {
  beforeEach(() => {
    vi.mocked(invokeLLM).mockReset();
    vi.mocked(listLLMModels).mockReset();
    vi.mocked(transcribeConciergeVoice).mockReset();
    vi.mocked(createDreamCarzVoiceSession).mockReset();
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
      context: { customerIntent: "rental", selectedVehicleId: "2022-chevrolet-traverse-white", vehicleType: "suv", customerStatus: "guest", authenticationStatus: "guest", onboardingStage: null, reservationStatus: "none" },
    })).resolves.toMatchObject({ intent: "rental", source: "live_guidance" });

    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-haiku-4-5",
      messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining("JOURNEY_CONTEXT") })]),
    }));
  });

  it("calculates a selected vehicle’s documented seven-day BWI market estimate without invoking the model", async () => {
    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({
      question: "How much will it cost total for 7 days?",
      context: { customerIntent: "rental", selectedVehicleId: "2024-ford-fusion-gray", vehicleType: "sedan", customerStatus: "guest", authenticationStatus: "guest", onboardingStage: "dates", reservationStatus: "in_progress" },
    });

    expect(result).toMatchObject({
      source: "bwi_market_estimate",
      intent: "rental",
      vehicleClass: "sedan",
      recommendedVehicleIds: ["2024-ford-fusion-gray"],
    });
    expect(result.answer).toContain("$62.33 per day");
    expect(result.answer).toContain("$436.31");
    expect(result.answer).toContain("before DreamCarz-specific charges or final availability");
    expect(result.marketEstimate).toMatchObject({
      days: 7,
      dailyLowCents: 6233,
      totalLowCents: 43631,
      isRange: false,
      pickupMarket: "BWI",
    });
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("renders the market estimate card with transparent included and pending charge labels", () => {
    expect(conciergePageSource).toContain('aria-label="Market estimate breakdown"');
    expect(conciergePageSource).toContain("Comparable taxes &amp; fees");
    expect(conciergePageSource).toContain("DreamCarz fees &amp; deposit");
    expect(conciergePageSource).toContain("Pending final quote");
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

  it("transcribes a bounded voice clip without retaining audio and rejects sensitive spoken content", async () => {
    vi.mocked(transcribeConciergeVoice).mockResolvedValue({ text: "Please show an SUV" });
    await expect(appRouter.createCaller(guestContext as never).concierge.transcribeVoice({ audioData: "data:audio/webm;base64,dm9pY2UtbWVzc2FnZQ==" })).resolves.toEqual({ text: "Please show an SUV" });

    vi.mocked(transcribeConciergeVoice).mockResolvedValue({ text: "My card number is 4111 1111 1111 1111" });
    await expect(appRouter.createCaller(guestContext as never).concierge.transcribeVoice({ audioData: "data:audio/webm;base64,dm9pY2UtbWVzc2FnZQ==" })).rejects.toThrow("For your privacy");
  });

  it("returns only a short-lived signed voice-session URL for the configured DreamCarz agent", async () => {
    vi.mocked(createDreamCarzVoiceSession).mockResolvedValue({ signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?token=short-lived" });

    await expect(appRouter.createCaller(guestContext as never).concierge.startVoiceAgentSession()).resolves.toEqual({ signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?token=short-lived" });
  });
});
