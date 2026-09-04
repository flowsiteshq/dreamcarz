import { describe, expect, it } from "vitest";

describe("ElevenLabs credential", () => {
  it("authenticates against the lightweight account endpoint with the server-only API key", async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey, "ELEVENLABS_API_KEY must be configured server-side").toBeTruthy();

    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey! },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok, `ElevenLabs account check failed with ${response.status}`).toBe(true);
  }, 15_000);
});
