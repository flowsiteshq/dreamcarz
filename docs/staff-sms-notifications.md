# DreamCarz Staff SMS Notifications

## Purpose and scope

This feature sends **internal operational SMS alerts** when a prospective customer grants contact consent or when an Associate enrollment is verified and activated. It never sends messages to customers, does not create accounts, and does not expose customer contact data, payment information, form answers, access tokens, or passwords in the text message.

The application creates an idempotent, durable outbox record for these events. A delivery key prevents duplicate staff texts for the same event and recipient. The outbox stores only a SHA-256 recipient hash; staff phone numbers remain server-only environment values. Delivery failures are retained for bounded retry by the existing one-shot Railway retry worker.

## Triggered events

| Event | When the alert is queued | Message content |
| --- | --- | --- |
| Marketing opt-in | A public advertising lead submits the required contact-consent form, or a new non-test Meta/Zapier lead is created. | Safe lead reference/ID and an instruction to review the protected Admin portal. |
| Associate opt-in | An active Associate captures a consented lead in the Associate portal. | Safe lead ID and an instruction to review the protected Associate portal. |
| Associate enrollment activated | The hosted $149 enrollment payment and $49 monthly subscription are provider-verified and Associate access is activated. | Safe enrollment reference and an instruction to review the protected Admin portal. |

## Twilio production configuration

Add the following values in Railway for the DreamCarz web service. All values are server-only; do not place them in frontend code, source control, screenshots, or chat.

| Variable | Required | Description |
| --- | --- | --- |
| `STAFF_SMS_NOTIFICATIONS_ENABLED` | Yes | Set to `true` only after the remaining variables are saved. |
| `STAFF_SMS_TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID. |
| `STAFF_SMS_TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token or a Twilio API-key secret paired with its compatible SID. |
| `STAFF_SMS_RECIPIENTS` | Yes | Comma-separated E.164 staff numbers, for example `+15551234567,+15557654321`. |
| `STAFF_SMS_TWILIO_FROM` | One of this or the Messaging Service SID | Twilio SMS-capable sending number in E.164 format. |
| `STAFF_SMS_TWILIO_MESSAGING_SERVICE_SID` | One of this or the sending number | Optional Twilio Messaging Service SID. Use this instead of `STAFF_SMS_TWILIO_FROM` when applicable. |

Set either a Twilio sending number or a Messaging Service SID, not both as the source of delivery. The application stays safely disabled when configuration is incomplete, while preserving a non-sensitive outbox audit record whenever a staff recipient list is present.

## Operational verification

After the environment variables deploy, submit one controlled consented lead. Confirm that exactly one staff recipient receives an SMS containing only the safe reference or ID, and verify the matching `staff_sms_notifications` row is marked `sent` with a provider message SID. Re-submit the same source event only through the application’s controlled duplicate path and confirm no second SMS is sent for the same recipient/event key.

> Do not use a real customer’s details for verification. Do not activate customer-facing SMS from this internal staff-alert feature.
