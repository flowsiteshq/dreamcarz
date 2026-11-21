import { FaceLivenessDetectorCore, type AwsCredentials } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react/styles.css";

type Props = {
  region: string;
  sessionId: string;
  credentials: AwsCredentials;
  onAnalysisComplete: () => Promise<void>;
  onError: (message: string) => void;
  onCancel: () => void;
};

export function AwsFaceLivenessCheck({ region, sessionId, credentials, onAnalysisComplete, onError, onCancel }: Props) {
  return <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-5">
    <FaceLivenessDetectorCore
      sessionId={sessionId}
      region={region}
      config={{ credentialProvider: async () => credentials }}
      onAnalysisComplete={onAnalysisComplete}
      onUserCancel={onCancel}
      onError={() => onError("The camera check could not be completed. A new secure session is required to try again.")}
    />
  </div>;
}
