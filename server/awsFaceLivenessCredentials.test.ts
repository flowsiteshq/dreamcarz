import { randomUUID } from "node:crypto";
import {
  GetFaceLivenessSessionResultsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { describe, expect, it } from "vitest";

describe("AWS Face Liveness credentials", () => {
  it("authenticates the dedicated server identity without creating a liveness session", async () => {
    expect(process.env.AWS_ACCESS_KEY_ID).toBeTruthy();
    expect(process.env.AWS_SECRET_ACCESS_KEY).toBeTruthy();
    expect(process.env.AWS_REGION).toBe("us-east-1");

    const sts = new STSClient({ region: process.env.AWS_REGION });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    expect(identity.Arn).toMatch(/user\/dreamcarz-face-liveness-server$/);

    const client = new RekognitionClient({ region: process.env.AWS_REGION });
    const nonexistentSessionId = randomUUID();

    await expect(
      client.send(
        new GetFaceLivenessSessionResultsCommand({
          SessionId: nonexistentSessionId,
        }),
      ),
    ).rejects.toMatchObject({ name: "SessionNotFoundException" });
  }, 15_000);
});
