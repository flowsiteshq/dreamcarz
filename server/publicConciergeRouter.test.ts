import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./paymentProvider", () => ({ cocardPaymentSetupBlocker: vi.fn(), getPaymentProviderStatus: vi.fn(), verifyCoCardCheckoutReturn: vi.fn() }));
vi.mock("./rateLimit", () => ({ consumeRateLimit: vi.fn(() => ({ allowed: true })), rateLimitKey: vi.fn((_: unknown, scope: string, subject: string) => `${scope}:${subject}`) }));
vi.mock("./_core/llm", () => ({ listLLMModels: vi.fn(), invokeLLM: vi.fn() }));
vi.mock("./elevenLabsTranscription", () => ({ transcribeConciergeVoice: vi.fn() }));
vi.mock("./elevenLabsVoiceAgent", () => ({ createDreamCarzVoiceSession: vi.fn() }));
vi.mock("./masterProgramConfig", () => ({ getActiveMasterProgramConfiguration: vi.fn() }));
vi.mock("./subscriptionRateCards", () => ({ getActiveSubscriptionRateCard: vi.fn(), RATE_NOT_CONFIGURED: "RATE_NOT_CONFIGURED" }));

import { invokeLLM, listLLMModels } from "./_core/llm";
import { transcribeConciergeVoice } from "./elevenLabsTranscription";
import { createDreamCarzVoiceSession } from "./elevenLabsVoiceAgent";
import { getActiveMasterProgramConfiguration } from "./masterProgramConfig";
import { getActiveSubscriptionRateCard } from "./subscriptionRateCards";
import { consumeRateLimit } from "./rateLimit";
import { appRouter } from "./routers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const guestContext = { req: { headers: {}, ip: "203.0.113.30" }, res: {} };
const conciergePageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Concierge.tsx"), "utf8");
const fleetPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Fleet.tsx"), "utf8");
const vehicleDialogSource = readFileSync(resolve(process.cwd(), "client/src/components/VehicleExperienceDialog.tsx"), "utf8");

describe("public DreamCarz concierge", () => {
  beforeEach(() => {
    vi.mocked(invokeLLM).mockReset();
    vi.mocked(listLLMModels).mockReset();
    vi.mocked(transcribeConciergeVoice).mockReset();
    vi.mocked(createDreamCarzVoiceSession).mockReset();
    vi.mocked(getActiveMasterProgramConfiguration).mockReset();
    vi.mocked(getActiveSubscriptionRateCard).mockReset();
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

  it("routes Tesla requests to the Tesla Model 3 coming-soon waiting list without presenting it as confirmed inventory", async () => {
    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "Do you have a Tesla I can rent?" });

    expect(result).toMatchObject({
      source: "tesla_model_3_waitlist",
      intent: "rental",
      vehicleClass: "sedan",
      waitlistVehicleId: "coming-soon-2024-tesla-model-3",
      recommendedVehicleIds: [],
    });
    expect(result.answer).toContain("Tesla Model 3s are coming soon");
    expect(result.answer).toContain("not part of current confirmed DreamCarz inventory");
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(conciergePageSource).toContain("getComingSoonVehicle(entry.waitlistVehicleId)");
    expect(conciergePageSource).toContain("Join waiting list");
    expect(fleetPageSource).toContain("requestedReserveVehicleId");
    expect(vehicleDialogSource).toContain("Join ${fullName} waiting list");
  });

  it("routes a non-Tesla planned vehicle to the catalog-backed waiting list without a current-inventory or pricing claim", async () => {
    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "Can I get on the waitlist for a Cadillac Escalade?" });

    expect(result).toMatchObject({
      source: "coming_soon_waitlist",
      intent: "rental",
      vehicleClass: null,
      waitlistVehicleId: "coming-soon-2025-cadillac-escalade",
      recommendedVehicleIds: [],
      marketEstimate: null,
    });
    expect(result.answer).toContain("Coming Soon");
    expect(result.answer).toContain("not current DreamCarz inventory");
    expect(result.answer).not.toMatch(/\$|available now|confirmed inventory/i);
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("explains an approved membership configuration without presenting its reference rate as a final quote", async () => {
    vi.mocked(getActiveMasterProgramConfiguration).mockResolvedValue({
      code: "DREAMCARZ_MASTER_2026_09_11",
      version: "1.3",
      effectiveStart: new Date("2026-09-11T00:00:00.000Z"),
      effectiveEnd: null,
      faceValueDcpPerDollar: 100,
      standardWalletEarnRatePerEligibleDollar: 10,
      membershipPlans: [{ code: "FREEDOM", name: "Freedom", enrollmentFeeCents: 24_900, monthlyFeeCents: 4_900, startingDcpr: 15_000, multiplier: 1, vehicleAccess: "$10K–$15K", asLowDailyRateCents: 4495, dcpPerDay: 500, walletCodes: ["DCPR"] }],
      walletDefinitions: [],
    });

    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({ question: "What does Freedom membership cost?" });

    expect(result).toMatchObject({ source: "master_program_membership_configuration", intent: "membership", recommendedVehicleIds: [] });
    expect(result.answer).toContain("$249.00 enrollment");
    expect(result.answer).toContain("$49.00 monthly");
    expect(result.answer).toContain("not a final vehicle quote");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("returns RATE_NOT_CONFIGURED and manual review when selected vehicle subscription economics are not approved", async () => {
    vi.mocked(getActiveSubscriptionRateCard).mockResolvedValue(null);

    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({
      question: "Can I subscribe to this vehicle monthly?",
      context: { customerIntent: "rental", selectedVehicleId: "2024-ford-fusion-gray", vehicleType: "sedan", customerStatus: "guest", authenticationStatus: "guest", onboardingStage: "dates", reservationStatus: "in_progress" },
    });

    expect(result).toMatchObject({ source: "RATE_NOT_CONFIGURED", intent: "rental", recommendedVehicleIds: ["2024-ford-fusion-gray"] });
    expect(result.answer).toContain("subscription rate is not configured");
    expect(result.answer).toContain("before issuing a quote");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("uses an approved vehicle-specific subscription reference without presenting it as a final quote", async () => {
    vi.mocked(getActiveSubscriptionRateCard).mockResolvedValue({
      vehicleId: "2024-ford-fusion-gray",
      membershipPlanCode: "PLUS",
      termMonths: 12,
      monthlyBaseCents: 69900,
      includedMilesPerMonth: 1200,
      includedDaysPerMonth: 30,
      monthlyDcpCap: 25000,
      depositCents: null,
      coverageConfiguration: "Approved coverage configuration",
      effectiveStart: new Date("2026-09-14T00:00:00.000Z"),
      effectiveEnd: null,
    });

    const result = await appRouter.createCaller(guestContext as never).concierge.publicGuide({
      question: "Can I subscribe to this vehicle monthly?",
      context: { customerIntent: "rental", selectedVehicleId: "2024-ford-fusion-gray", vehicleType: "sedan", customerStatus: "guest", authenticationStatus: "guest", onboardingStage: "dates", reservationStatus: "in_progress" },
    });

    expect(result).toMatchObject({ source: "subscription_rate_reference", intent: "rental", recommendedVehicleIds: ["2024-ford-fusion-gray"] });
    expect(result.answer).toContain("$699.00 monthly");
    expect(result.answer).toContain("not a final quote");
    expect(result.answer).toContain("protected review");
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
