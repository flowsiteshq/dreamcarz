# AWS Face Liveness Setup Status

**Date:** 2026-08-31
**Region:** `us-east-1`
**Status:** IAM identity and temporary-role validation completed; customer camera verification remains disabled.

DreamCarz has a dedicated server-side IAM user for the Face Liveness boundary. Console access is disabled for that identity, and its existing server permissions remain limited to the backend actions required to create a Face Liveness session and retrieve a result. Its protected server credentials were previously verified through a harmless nonexistent-session lookup.

The separate browser credential role, `dreamcarz-face-liveness-browser`, was created and its trust policy permits assumption only by `dreamcarz-face-liveness-server`. Its inline role policy permits only `rekognition:StartFaceLivenessSession` on `*`. The dedicated server user's inline policy now permits only `sts:AssumeRole` on the exact browser role ARN; no broader role-assumption permission was granted.

On 2026-08-31, a server-side validation confirmed that the protected server identity could assume the scoped browser role using a 15-minute session and a further restrictive session policy. The validation created no Face Liveness session, did not invoke Rekognition, and neither printed nor persisted temporary credentials, session tokens, session identifiers, images, video, confidence data, or raw provider responses. The temporary validation script was removed immediately after the successful check.

## Activation boundary

This validation completes the AWS IAM prerequisite and DreamCarz now includes a protected server-session and credential-broker handoff. The server-created session procedure is available only to the signed-in owner of a transaction at the identity step, records document and biometric consent before the provider call, and persists only the opaque provider session identifier. The credential broker applies a per-account rate limit before private lookup and returns a temporary start-only credential only for that same owned pending session with active, unwithdrawn document and biometric consent. Its audit event contains no credential material. Deterministic tests cover the rate-limit, unavailable-transaction, missing-consent, disabled-provider, successful temporary-credential, server-session ordering, and provider-error paths.

DreamCarz must continue to treat the customer camera flow as **disabled**. The production application has not been configured with the browser-role ARN or the separate browser-flow setting, and no customer interface calls the broker. The adapter requires a distinct browser-flow enablement setting in addition to server credentials, the role ARN, and the base provider setting before it can create a session or issue short-lived browser credentials. Administrator launch readiness distinguishes a prepared temporary-credential path from an enabled customer camera flow.

Before any customer-facing activation, the application must implement and verify all of the following remaining controls:

- official browser Face Liveness client integration that receives only short-lived scoped credentials;
- server-only result lookup followed by manual review, with no automatic face-to-ID matching, eligibility approval, or retention of raw biometric media; and
- privacy, audit, accessibility, and visual review of the completed customer flow.

No customer biometric session has been created, and this record does not establish legal, regulatory, security-certification, identity-matching, eligibility, or approval outcomes.
