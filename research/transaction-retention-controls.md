# DreamCarz Transaction Record Retention and Deletion Controls

## Current control boundary

DreamCarz treats driver-license images, live-selfie records, insurance artifacts, signed agreements, and transaction-condition evidence as private, transaction-bound records. The application stores private storage keys and selected operational metadata rather than card data, biometric templates, raw provider payloads, or provider client secrets. Access is limited to the account owner and authorized DreamCarz administrators through account-bound, time-limited secure links.

## Customer controls

Customers must give explicit transaction-scoped consent before submitting a driver-license image or live selfie. They may withdraw document or biometric consent at any time. A withdrawal pauses automated identity handling, routes the affected transaction to manual review, and records an immutable audit event. Customers may also submit an identity-record deletion request. That request does not automatically delete data: it pauses the transaction, creates a privacy audit event, and requires an authorized DreamCarz reviewer to determine whether a legal, contractual, fraud-prevention, accounting, or dispute-retention obligation requires continued retention.

## Administrator review

The administrator transaction console exposes the resulting manual-review exception, consent history, secure record metadata, agreements, payment identifiers, condition reports, and chronological audit events. Administrators must not download, copy, or disclose private records except for a documented, authorized operational purpose. Provider integrations remain disabled until DreamCarz completes the required account configuration, contract review, and operational rollout.

## Implementation requirements before live-provider activation

Before activating identity, payment, or e-signature providers, DreamCarz should obtain counsel-approved retention schedules, jurisdiction-specific notices, deletion-review procedures, security access reviews, and an escalation owner. Provider-specific deletion and retention actions must be implemented against the selected provider’s documented APIs and logged in the transaction audit trail. This document intentionally does not set retention periods or represent legal advice.
