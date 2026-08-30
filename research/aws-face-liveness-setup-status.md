# AWS Face Liveness Setup Status

**Date:** 2026-08-30  
**Region:** `us-east-1`  
**Status:** In progress; no customer biometric session has been created.

DreamCarz now has a dedicated IAM user for the server-side Face Liveness boundary. Console access is disabled. Its policy is limited to the backend actions required to create a Face Liveness session and retrieve its result. The user’s credentials were placed only in protected server settings and a harmless nonexistent-session lookup verified that the configured identity is the dedicated service user.

The next configuration step creates a separate temporary browser credential role. Its trust policy has been restored to allow only the dedicated DreamCarz server user to issue credentials. Its inline policy now permits only `rekognition:StartFaceLivenessSession` against the service-supported all-resources scope; it does not permit session creation, result retrieval, image access, S3 access, or unrelated AWS actions.

The customer camera flow remains disabled pending the temporary-role completion, server-side assume-role configuration, explicit customer consent UI, and manual-review-only result handling. DreamCarz must not retain raw selfie video, reference images, audit images, or long-term credentials in browser code.
