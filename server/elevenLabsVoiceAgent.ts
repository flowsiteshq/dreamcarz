export const DREAMCARZ_ELEVENLABS_AGENT_ID = "agent_2201m1pgdbjyfmm8s7gty7v026y4";

type SignedVoiceSession = {
  signedUrl: string;
};

export async function createDreamCarzVoiceSession(): Promise<SignedVoiceSession> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Live DreamCarz voice is not configured.");

  const endpoint = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  endpoint.searchParams.set("agent_id", DREAMCARZ_ELEVENLABS_AGENT_ID);

  const response = await fetch(endpoint, {
    headers: { "xi-api-key": apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Live DreamCarz voice is temporarily unavailable.");

  const payload: unknown = await response.json();
  const signedUrl = typeof payload === "object" && payload !== null && "signed_url" in payload && typeof payload.signed_url === "string"
    ? payload.signed_url
    : "";
  if (!signedUrl.startsWith("wss://")) throw new Error("Live DreamCarz voice is temporarily unavailable.");

  return { signedUrl };
}
