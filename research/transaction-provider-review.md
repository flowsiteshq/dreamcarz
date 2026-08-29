# DreamCarz Transaction Provider Review

## Identity verification

Stripe Identity supports government-issued document verification and document-to-selfie matching in the United States. Its Verification Sessions API returns a status including `verified` or `requires_input`; Stripe recommends reusing a session, using idempotency keys, and responding to status changes through verified webhook events. The DreamCarz application should store only the provider session identifier and status, never raw biometric data or identity-document content in general transaction records. Document and selfie collection must be conditioned on explicit consent, with a manual-review alternative if the customer declines or fails automated verification. [1] [2] [3]

## Payments

Stripe Checkout or Payment Elements should collect payment details through Stripe rather than DreamCarz. DreamCarz should retain only necessary Stripe object identifiers and business-state references—not card number, CVV, expiry date, client secret, or raw webhook payload. Payment and deposit capture will remain blocked until approved pricing is entered for the selected membership and vehicle transaction.

## Agreements

DocuSign eSignature supports embedded signing and event notifications for signature status. A production agreement flow should generate an agreement from reviewed data only after identity/eligibility conditions are satisfied, route the customer to an embedded signing session, and store the envelope identifier, signature status, timestamps, and a signed-document reference. [4] [5]

## Contract addendum scope

The user-provided **Dream Carz Rental Contract Addendum** includes renter initials and acknowledgements for vehicle condition, tires, fluid maintenance, overheating/towing instructions, tickets/impounds, early return/deposit treatment, rideshare maintenance, rent-to-own terms, smoking, cleanliness, late return, GPS disclosure, attorneys’ fees, and final acknowledgement. These terms should be rendered only into a legally reviewed agreement template; the workflow should capture agreement version, signer identity, signed timestamp, and signature-provider evidence rather than treating an in-app checkbox as a completed agreement.

## Sources

[1]: https://docs.stripe.com/identity "Stripe Identity"
[2]: https://docs.stripe.com/identity/verification-sessions "Stripe Verification Sessions API"
[3]: https://docs.stripe.com/identity/handle-verification-outcomes "Stripe Identity verification outcomes"
[4]: https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedding/embedded-signing/ "DocuSign embedded signing"
[5]: https://developers.docusign.com/docs/esign-rest-api/reference/connect/ "DocuSign Connect"

## Stripe Identity implementation update — 2026-08-29

Stripe documents that a VerificationSession should be reused when an interrupted verification resumes, and that an idempotency key helps prevent duplicate sessions. DreamCarz therefore stores only the provider session identifier in its transaction/profile records and creates sessions with a transaction-reference idempotency key. The Stripe client secret is sensitive: it must be returned only to the authenticated person being verified over TLS and must never be stored, logged, or placed in a URL. [2]

The required lifecycle webhook outcomes are `identity.verification_session.verified` and `identity.verification_session.requires_input`; the latter must remain a review/retry/manual-alternative state rather than an approval. Stripe also documents a redaction outcome that should be handled for privacy requests. DreamCarz now has a raw-body, signature-verifying webhook endpoint with an idempotent provider-event identifier, but it deliberately stays inactive until Stripe Identity is explicitly enabled and the account-specific webhook destination/secret are configured. [2] [3]

The endpoint was locally checked with an unsigned POST and returned `{"received":false,"code":"stripe_webhook_not_configured"}` without processing transaction data.

## Stripe payment-method implementation update — 2026-08-29

For rental or purchase workflows where the final amount is not yet approved, DreamCarz uses the planned Stripe Checkout `setup` mode rather than inventing a vehicle price or creating a charge. Checkout collects the method on Stripe’s hosted surface; DreamCarz retains only the necessary customer, Checkout Session, SetupIntent, and PaymentMethod identifiers. The customer must explicitly authorize the described future use before the hosted payment step, and no amount is charged during payment-method setup. [6]

Payment completion is provider-driven. The verified Stripe webhook is prepared to reconcile `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` events idempotently. A successful payment method setup moves a transaction only to agreement/review readiness, never to vehicle release. A payment or deposit cannot be attempted until DreamCarz has approved real pricing, deposit, and authorization terms. [7]

[6]: https://docs.stripe.com/payments/save-and-reuse?payment-ui=embedded-components "Stripe Checkout setup mode for saving payment methods"
[7]: https://docs.stripe.com/payments/payment-intents/verifying-status "Stripe payment status updates and fulfillment webhooks"

## DocuSign agreement implementation update — 2026-08-29

DocuSign documents that embedded signing uses an envelope recipient view so an authenticated signer can review and sign within the application experience. DreamCarz should create the envelope only after an approved, legally reviewed agreement template and authorized transaction data are available; it should retain the provider envelope identifier, lifecycle status, timestamps, and a signed-document reference rather than treating an in-app acknowledgement as a signature. [8] [9]

DocuSign Connect can report envelope lifecycle events, including `envelope-completed` after all recipients have completed signing. DreamCarz must use the provider callback as the source of truth for a signed agreement and must not release a vehicle solely because a browser returns from a recipient view. [10]

[8]: https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedding/embedded-signing/ "DocuSign embedded signing"
[9]: https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/ "DocuSign recipient view API"
[10]: https://developers.docusign.com/platform/webhooks/connect/event-triggers/ "DocuSign Connect event triggers"
