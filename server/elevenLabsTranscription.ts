const MAX_CONCIERGE_AUDIO_BYTES = 600_000;
const AUDIO_DATA_URL = /^data:((?:audio\/(?:webm|ogg|wav|mpeg|mp4)|video\/webm)(?:;codecs=[a-z0-9._-]+)?);base64,([a-z0-9+/=\r\n]+)$/i;

export type ConciergeVoiceTranscription = {
  text: string;
};

export function decodeConciergeAudioData(audioData: string) {
  const match = AUDIO_DATA_URL.exec(audioData);
  if (!match) throw new Error("Voice input must be a supported browser audio recording.");

  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!bytes.length || bytes.length > MAX_CONCIERGE_AUDIO_BYTES) {
    throw new Error("Voice input is too large. Please keep your message brief.");
  }

  return { bytes, mimeType: match[1] };
}

export async function transcribeConciergeVoice(audioData: string): Promise<ConciergeVoiceTranscription> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Voice transcription is not configured.");

  const { bytes, mimeType } = decodeConciergeAudioData(audioData);
  const body = new FormData();
  body.set("model_id", "scribe_v2");
  body.set("file", new Blob([bytes], { type: mimeType }), `dreamcarz-concierge.${mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm"}`);

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text?enable_logging=false", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error("Voice transcription is temporarily unavailable.");
  const payload: unknown = await response.json();
  const text = typeof payload === "object" && payload !== null && "text" in payload && typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) throw new Error("I could not hear a question. Please try again.");

  return { text: text.slice(0, 240) };
}
