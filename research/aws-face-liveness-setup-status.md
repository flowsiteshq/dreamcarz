# AWS Face Liveness Setup Status

**Date:** 2026-08-31
**Region:** `us-east-1`
**Status:** IAM identity and temporary-role validation completed; customer camera verification remains disabled.

DreamCarz has a dedicated server-side IAM user for the Face Liveness boundary. Console access is disabled for that identity, and its existing server permissions remain limited to the backend actions required to create a Face Liveness session and retrieve a result. Its protected server credentials were previously verified through a harmless nonexistent-session lookup.

The separate browser credential role, `dreamcarz-face-liveness-browser`, was created and its trust policy permits assumption only by `dreamcarz-face-liveness-server`. Its inline role policy permits only `rekognition:StartFaceLivenessSession` on `*`. The dedicated server user's inline policy now permits only `sts:AssumeRole` on the exact browser role ARN; no broader role-assumption permission was granted.

On 2026-08-31, a server-side validation confirmed that the protected server identity could assume the scoped browser role using a 15-minute session and a further restrictive session policy. The validation created no Face Liveness session, did not invoke Rekognition, and neither printed nor persisted temporary credentials, session tokens, session identifiers, images, video, confidence data, or raw provider responses. The temporary validation script was removed immediately after the successful check.

## Activation boundary

This validation completes only the AWS IAM prerequisite. DreamCarz must continue to treat the customer camera flow as **disabled**. The production application has not been configured with the browser-role ARN, does not issue browser credentials, and does not create a biometric session.

Before any customer-facing activation, the application must implement and verify all of the following controls:

- a protected credential-broker procedure limited to the signed-in account's owned pending identity transaction;
- explicit, recorded customer consent before any provider session is created or browser credential is issued;
- account-level rate limits and deterministic success/error coverage for the broker;
- official browser Face Liveness client integration that receives only short-lived scoped credentials;
- server-only result lookup followed by manual review, with no automatic face-to-ID matching, eligibility approval, or retention of raw biometric media; and
- privacy, audit, accessibility, and visual review of the completed customer flow.

No customer biometric session has been created, and this record does not establish legal, regulatory, security-certification, identity-matching, eligibility, or approval outcomes.
