# AWS Face Liveness Setup Status

**Date:** 2026-08-31
**Region:** `us-east-1`
**Status:** IAM identity, temporary-role validation, protected configuration, and one explicitly authorized account-owned camera validation completed; the resulting transaction is in manual review.

DreamCarz has a dedicated server-side IAM user for the Face Liveness boundary. Console access is disabled for that identity, and its existing server permissions remain limited to the backend actions required to create a Face Liveness session and retrieve a result. Its protected server credentials were previously verified through a harmless nonexistent-session lookup.

The separate browser credential role, `dreamcarz-face-liveness-browser`, was created and its trust policy permits assumption only by `dreamcarz-face-liveness-server`. Its inline role policy permits only `rekognition:StartFaceLivenessSession` on `*`. The dedicated server user's inline policy now permits only `sts:AssumeRole` on the exact browser role ARN; no broader role-assumption permission was granted.

On 2026-08-31, a server-side validation confirmed that the protected server identity could assume the scoped browser role using a 15-minute session and a further restrictive session policy. The validation created no Face Liveness session, did not invoke Rekognition, and neither printed nor persisted temporary credentials, session tokens, session identifiers, images, video, confidence data, or raw provider responses. The temporary validation script was removed immediately after the successful check.

## Activation boundary

This validation completes the AWS IAM prerequisite and DreamCarz now includes a protected server-session and credential-broker handoff. The server-created session procedure is available only to the signed-in owner of a transaction at the identity step, records document and biometric consent before the provider call, and persists only the opaque provider session identifier. The credential broker applies a per-account rate limit before private lookup and returns a temporary start-only credential only for that same owned pending session with active, unwithdrawn document and biometric consent. Its audit event contains no credential material. Deterministic tests cover the rate-limit, unavailable-transaction, missing-consent, disabled-provider, successful temporary-credential, server-session ordering, and provider-error paths.

On 2026-08-31, DreamCarz's approved protected configuration loaded the browser-role reference and the separate browser-flow gate. A lightweight protected status test confirmed the adapter reports ready without contacting Rekognition, creating a Face Liveness session, issuing browser credentials, or recording biometric data. The official `FaceLivenessDetectorCore` browser component is conditionally available only to the signed-in owner of a transaction at the identity step after both consents are recorded. It first creates the server-side session, receives a short-lived credential handoff only for that session, and clears its in-memory handoff after completion, cancellation, or error. Administrator launch readiness distinguishes the configured credential path from the remaining customer-flow validation work.

On 2026-08-31, the account owner completed one authorized camera validation in an account-owned rental transaction after the transaction-specific document and biometric consents were recorded. Minimal application audit indicators confirm one server-created session, one temporary browser-credential handoff, and one completed provider result. The application did not persist or expose the session identifier, credentials, images, video, confidence data, or raw provider response in browser-facing records.

The completed result was then routed to **manual review** through an idempotent account-owned reconciliation using only the existing minimal completion audit; it made no additional provider request and did not create another session or credential handoff. The transaction remains in manual review, while license, eligibility, payment, agreement, and vehicle-release status remain pending. A member-facing transaction panel now states this boundary explicitly.

Before DreamCarz treats the customer flow as launch-ready, the application must complete and verify all of the following remaining controls:

- production-safe browser and device testing of the official Face Liveness component, including cancellation, failure, retry, and accessibility paths;
- server-only result lookup followed by manual review, with no automatic face-to-ID matching, eligibility approval, or retention of raw biometric media; and
- privacy, audit, accessibility, and visual review of the completed customer flow.

This record does not establish legal, regulatory, security-certification, identity-matching, driver-license verification, eligibility, payment, agreement, vehicle-release, approval, or launch-readiness outcomes.

## Official implementation references

The integration design follows AWS documentation describing a server-created `CreateFaceLivenessSession` session, a browser-side `StartFaceLivenessSession` stream using temporary scoped credentials, and server-side retrieval of results. AWS also documents that sessions are single-use and expire after three minutes, so a canceled or failed customer attempt must receive a newly created session rather than reuse an existing one.

- Amazon Rekognition, [Detecting face liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- Amazon Rekognition, [CreateFaceLivenessSession API](https://docs.aws.amazon.com/rekognition/latest/APIReference/API_CreateFaceLivenessSession.html)
- Amplify UI, [Face Liveness for React](https://ui.docs.amplify.aws/react/connected-components/liveness)
