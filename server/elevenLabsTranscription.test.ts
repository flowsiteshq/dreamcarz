import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeConciergeAudioData, transcribeConciergeVoice } from "./elevenLabsTranscription";

describe("ElevenLabs Concierge transcription", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses a bounded browser audio clip and requests ElevenLabs zero-retention transcription", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: "Find me an SUV" }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(transcribeConciergeVoice("data:audio/webm;base64,dm9pY2U=")).resolves.toEqual({ text: "Find me an SUV" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/speech-to-text?enable_logging=false",
      expect.objectContaining({ method: "POST", headers: { "xi-api-key": "test-key" } }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("model_id")).toBe("scribe_v2");
  });

  it("rejects unsupported or unbounded audio before it can reach the provider", () => {
    expect(() => decodeConciergeAudioData("data:text/plain;base64,dGVzdA==")).toThrow("supported browser audio");
    const tooLarge = Buffer.alloc(600_001).toString("base64");
    expect(() => decodeConciergeAudioData(`data:audio/webm;base64,${tooLarge}`)).toThrow("too large");
  });
});
