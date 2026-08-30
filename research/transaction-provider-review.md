# DreamCarz Transaction Provider Review

## Identity verification

Stripe Identity supports government-issued document verification and document-to-selfie matching in the United States. Its Verification Sessions API returns a status including `verified` or `requires_input`; Stripe recommends reusing a session, using idempotency keys, and responding to status changes through verified webhook events. The DreamCarz application should store only the provider session identifier and status, never raw biometric data or identity-document content in general transaction records. Document and selfie collection must be conditioned on explicit consent, with a manual-review alternative if the customer declines or fails automated verification. [1] [2] [3]

### AWS Face Liveness alternative — reviewed, not activated

Because a Stripe Identity sandbox is not available for DreamCarz, **Amazon Rekognition Face Liveness** is a viable alternative for the live-selfie portion of the identity journey. AWS documents that Face Liveness uses a short video selfie and returns a probabilistic confidence result plus a reference image; it must be combined with other risk controls rather than treated as a guaranteed identity decision. The DreamCarz implementation must therefore keep its existing explicit consent, manual-review, retry, retention, and deletion-request safeguards. [8] [9]

For a future AWS rollout, DreamCarz would create an account-owned liveness session on the server, supply only short-lived and limited credentials to the web liveness component, evaluate the session result on the server, and store only the status and provider session identifier in DreamCarz. It must not persist liveness confidence scores, audit images, reference images, raw biometric video, or browser credentials in application records. AWS recommends an alternative path for people who decline or cannot use liveness verification, so the existing manual-review option remains required. [9]

This option is **not activated**. It requires an AWS region decision, a dedicated least-privilege role/identity-pool design, appropriate billing and data-retention review, counsel-approved privacy notice and consent language, operating thresholds tested on DreamCarz data, and a verified driver-license image comparison process. No biometric session has been created.

## Payments

Stripe Checkout or Payment Elements should collect payment details through Stripe rather than DreamCarz. DreamCarz should retain only necessary Stripe object identifiers and business-state references—not card number, CVV, expiry date, client secret, or raw webhook payload. Payment and deposit capture will remain blocked until approved pricing is entered for the selected membership and vehicle transaction.

## Agreements

DreamCarz will use a native controlled signing workflow rather than an external e-signature provider. The application prepares an agreement only from an administrator-activated, counsel-approved immutable template, snapshots the rendered content at preparation, captures the account-bound signer name and explicit acknowledgement, records a timestamp and integrity hash, stores a private signed artifact, and appends immutable audit events. Native signing remains subject to counsel’s approval of the agreement language, entity identity, disclosure, record-retention, and electronic-signature process before production release.

## Contract addendum scope

The user-provided **Dream Carz Rental Contract Addendum** includes renter initials and acknowledgements for vehicle condition, tires, fluid maintenance, overheating/towing instructions, tickets/impounds, early return/deposit treatment, rideshare maintenance, rent-to-own terms, smoking, cleanliness, late return, GPS disclosure, attorneys’ fees, and final acknowledgement. These terms can be rendered only into a legally reviewed native agreement template; the workflow captures template version, signer identity, explicit acknowledgement, signed timestamp, integrity record, and a private signed artifact. The addendum must not be activated until legal review resolves its apparent Awesome Auto Group, Inc./Dream Carz, LLC entity inconsistency.

## Sources

[1]: https://docs.stripe.com/identity "Stripe Identity"
[2]: https://docs.stripe.com/identity/verification-sessions "Stripe Verification Sessions API"
[3]: https://docs.stripe.com/identity/handle-verification-outcomes "Stripe Identity verification outcomes"
[8]: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html "Amazon Rekognition Face Liveness"
[9]: https://docs.aws.amazon.com/rekognition/latest/dg/recommendations-liveness.html "AWS Face Liveness recommendations"

## Stripe Identity implementation update — 2026-08-29

Stripe documents that a VerificationSession should be reused when an interrupted verification resumes, and that an idempotency key helps prevent duplicate sessions. DreamCarz therefore stores only the provider session identifier in its transaction/profile records and creates sessions with a transaction-reference idempotency key. The Stripe client secret is sensitive: it must be returned only to the authenticated person being verified over TLS and must never be stored, logged, or placed in a URL. [2]

The required lifecycle webhook outcomes are `identity.verification_session.verified` and `identity.verification_session.requires_input`; the latter must remain a review/retry/manual-alternative state rather than an approval. Stripe also documents a redaction outcome that should be handled for privacy requests. DreamCarz now has a raw-body, signature-verifying webhook endpoint with an idempotent provider-event identifier, but it deliberately stays inactive until Stripe Identity is explicitly enabled and the account-specific webhook destination/secret are configured. [2] [3]

The endpoint was locally checked with an unsigned POST and returned `{"received":false,"code":"stripe_webhook_not_configured"}` without processing transaction data.

## Stripe payment-method implementation update — 2026-08-29

For rental or purchase workflows where the final amount is not yet approved, DreamCarz uses the planned Stripe Checkout `setup` mode rather than inventing a vehicle price or creating a charge. Checkout collects the method on Stripe’s hosted surface; DreamCarz retains only the necessary customer, Checkout Session, SetupIntent, and PaymentMethod identifiers. The customer must explicitly authorize the described future use before the hosted payment step, and no amount is charged during payment-method setup. [6]

Payment completion is provider-driven. The verified Stripe webhook is prepared to reconcile `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` events idempotently. A successful payment method setup moves a transaction only to agreement/review readiness, never to vehicle release. A payment or deposit cannot be attempted until DreamCarz has approved real pricing, deposit, and authorization terms. [7]

[6]: https://docs.stripe.com/payments/save-and-reuse?payment-ui=embedded-components "Stripe Checkout setup mode for saving payment methods"
[7]: https://docs.stripe.com/payments/payment-intents/verifying-status "Stripe payment status updates and fulfillment webhooks"

## Native agreement implementation update — 2026-08-29

DreamCarz replaced the inactive external-agreement path with native controlled document signing. An administrator must first deliberately activate an exact, counsel-approved rental or purchase template with an immutable version and legal-approval reference. The customer then reviews the transaction-specific content snapshot, types their full legal name, makes separate agreement acknowledgement and electronic-signature-consent assertions, and creates a timestamped private signed artifact. The system records a cryptographic integrity hash, a hashed network-address record when present, the account-bound signer ID, the document version, and chronological transaction events.

The application does not assert that a native signature alone is sufficient for any jurisdiction, transaction, or agreement. The supplied addendum remains unavailable to customers until appropriate counsel approves the exact language, entity information, disclosures, retention policy, and signing process.
