import { FaceLivenessDetectorCore, type AwsCredentialProvider } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react-liveness/styles.css";
import { useCallback } from "react";

type TemporaryCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
};

type AwsFaceLivenessDetectorProps = {
  sessionId: string;
  region: string;
  credentials: TemporaryCredentials;
  onAnalysisComplete: () => Promise<void>;
  onUserCancel: () => void;
  onError: () => void;
};

export function AwsFaceLivenessDetector({ sessionId, region, credentials, onAnalysisComplete, onUserCancel, onError }: AwsFaceLivenessDetectorProps) {
  const credentialProvider = useCallback<AwsCredentialProvider>(async () => credentials, [credentials]);

  return <FaceLivenessDetectorCore sessionId={sessionId} region={region} config={{ credentialProvider }} onAnalysisComplete={onAnalysisComplete} onUserCancel={onUserCancel} onError={onError} />;
}
