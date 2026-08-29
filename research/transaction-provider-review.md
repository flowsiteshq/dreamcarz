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
