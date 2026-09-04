import { afterEach, describe, expect, it, vi } from "vitest";
import { DREAMCARZ_ELEVENLABS_AGENT_ID, createDreamCarzVoiceSession } from "./elevenLabsVoiceAgent";

describe("DreamCarz ElevenLabs voice session", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mints a server-only signed session URL for the dedicated DreamCarz agent", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?token=test" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDreamCarzVoiceSession()).resolves.toEqual({ signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?token=test" });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${DREAMCARZ_ELEVENLABS_AGENT_ID}`),
      expect.objectContaining({ headers: { "xi-api-key": "test-key" } }),
    );
  });

  it("does not return a malformed or missing signed URL to the browser", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ signed_url: "https://not-a-voice-session" }), { status: 200 })));

    await expect(createDreamCarzVoiceSession()).rejects.toThrow("Live DreamCarz voice is temporarily unavailable.");
  });
});
