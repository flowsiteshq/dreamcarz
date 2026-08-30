import {
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";

const DEFAULT_AWS_REGION = "us-east-1";

export type AwsFaceLivenessStatus = {
  provider: "aws_face_liveness";
  region: string;
  serverCredentialsConfigured: boolean;
  browserCredentialBrokerConfigured: boolean;
  enabled: boolean;
  configured: boolean;
  mode: "ready" | "manual_review";
};

function getRegion() {
  return process.env.AWS_REGION?.trim() || DEFAULT_AWS_REGION;
}

export function getAwsFaceLivenessStatus(): AwsFaceLivenessStatus {
  const serverCredentialsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
  const browserCredentialBrokerConfigured = Boolean(
    process.env.AWS_FACE_LIVENESS_BROWSER_ROLE_ARN?.startsWith("arn:aws:iam::"),
  );
  const enabled = process.env.AWS_FACE_LIVENESS_ENABLED === "true";
  const configured = serverCredentialsConfigured && browserCredentialBrokerConfigured && enabled;

  return {
    provider: "aws_face_liveness",
    region: getRegion(),
    serverCredentialsConfigured,
    browserCredentialBrokerConfigured,
    enabled,
    configured,
    mode: configured ? "ready" : "manual_review",
  };
}

function getClient() {
  return new RekognitionClient({ region: getRegion() });
}

/**
 * Creates the provider-side session only after the caller records explicit
 * consent. DreamCarz persists the opaque session identifier separately; no
 * face image, video, confidence score, or raw provider response is retained.
 */
export async function createAwsFaceLivenessSession(input: {
  clientRequestToken: string;
}) {
  const provider = getAwsFaceLivenessStatus();
  if (!provider.configured) return { configured: false as const, provider };

  const result = await getClient().send(new CreateFaceLivenessSessionCommand({
    ClientRequestToken: input.clientRequestToken,
    Settings: { AuditImagesLimit: 0 },
  }));
  if (!result.SessionId) {
    throw new Error("AWS Face Liveness did not return a verification session.");
  }
  return { configured: true as const, provider, sessionId: result.SessionId };
}

/**
 * Reads a completed provider session for a server-side manual-review decision.
 * This helper returns only the provider completion state; callers must never
 * persist images, reference images, confidence data, or raw provider payloads.
 */
export async function getAwsFaceLivenessResult(sessionId: string) {
  const provider = getAwsFaceLivenessStatus();
  if (!provider.configured) return { configured: false as const, provider };

  const result = await getClient().send(
    new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }),
  );
  return {
    configured: true as const,
    provider,
    status: result.Status,
  };
}
