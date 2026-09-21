# DreamCarz Staff Email and Text Alerts

## Purpose and scope

DreamCarz queues a **staff-only operational alert** when a prospective customer grants contact consent or an Associate enrollment is verified and activated. The alert never contacts customers. It deliberately excludes customer phone numbers, email addresses, payment information, form answers, passwords, access tokens, and other restricted data; staff use the protected DreamCarz portal to review the corresponding record.

Each event is recorded in a durable, idempotent outbox. A delivery key prevents duplicate notifications, and the database stores only a one-way recipient hash—not an email-to-text address or phone number. Failed attempts remain available to the existing bounded retry worker.

## Triggered events

| Event | When the alert is queued | Safe alert content |
| --- | --- | --- |
| Marketing opt-in | A public advertising lead submits the required contact-consent form, or a new non-test Meta/Zapier lead is created. | Safe lead reference/ID and an instruction to review the protected Admin portal. |
| Associate opt-in | An active Associate captures a consented lead in the Associate portal. | Safe lead ID and an instruction to review the protected Associate portal. |
| Associate enrollment activated | The hosted $149 enrollment payment and $49 monthly subscription are provider-verified and Associate access is activated. | Safe enrollment reference and an instruction to review the protected Admin portal. |

## Existing staff email route

The existing **Email by Zapier** workflow continues to deliver the full internal alert to `www.dreamcarz.io@gmail.com`. It remains optional and separate from phone delivery.

| Variable | Required value |
| --- | --- |
| `STAFF_EMAIL_ALERTS_ENABLED` | `true` to enable the existing email route. |
| `STAFF_EMAIL_ZAPIER_HOOK_URL` | The server-only HTTPS Catch Hook URL from the published DreamCarz Staff Lead and Enrollment Alerts Zap. |

The application accepts only HTTPS `hooks.zapier.com` hook URLs.

## Direct Gmail-to-T-Mobile text route

The requested text route is direct **DreamCarz Gmail → T-Mobile email-to-text gateway**. It does not use SendBlue, Twilio, a public client-side secret, or a customer messaging workflow. Text recipients are server-only Railway configuration values and are never committed to source control or stored in the database.

| Railway variable | Required value |
| --- | --- |
| `STAFF_SMS_EMAIL_GATEWAY_ENABLED` | `true` |
| `STAFF_SMS_SMTP_USER` | `www.dreamcarz.io@gmail.com` |
| `STAFF_SMS_SMTP_APP_PASSWORD` | A new Google **App Password** for the DreamCarz Gmail account, stored only in Railway. Never use the normal Gmail password. |
| `STAFF_SMS_T_MOBILE_GATEWAYS` | Comma-separated T-Mobile gateway addresses, for example `10digitnumber@tmomail.net`. |

The integration uses authenticated Gmail SMTP (`smtp.gmail.com`) and sends a concise, plain-text staff alert to each configured T-Mobile gateway address. Gmail message IDs are retained as provider references, while recipient values remain in Railway only. A Gmail App Password is required because standard Google sign-in/OAuth was not available to the server-side delivery worker.

## Verification procedure

After the server-only variables are added, use an internal test event containing no customer data. Verify all of the following:

1. Each configured staff line receives one plain-text alert.
2. The matching outbox records are marked `sent` with a Gmail provider message ID.
3. Replaying the same source event creates no second text or email outbox record.
4. The retry worker changes a temporary SMTP failure to `retry_scheduled` rather than silently dropping the alert.

> The prior Email by Zapier and Gmail compose tests are not proof of direct text delivery. Production direct Gmail-to-T-Mobile delivery remains **disabled** until its four Railway variables are configured and the controlled no-customer-data test passes.
