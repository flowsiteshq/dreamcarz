# DreamCarz Staff Email and Text Alerts

## Purpose and scope

DreamCarz queues a **staff-only operational alert** when a prospective customer grants contact consent or an Associate enrollment is verified and activated. The alert never contacts customers. For Facebook and Instagram leads, the owner-approved contact alert delivers the lead's **name, phone number, email address, interest, and source** to the configured staff recipients so staff can follow up. It excludes payment information, account information, full form answers, passwords, access tokens, and other restricted data.

Each event is recorded in a durable, idempotent outbox. A delivery key prevents duplicate notifications, and the database stores only a one-way recipient hash—not an email-to-text address or phone number. Failed server-side attempts remain available to the existing bounded retry worker.

## Triggered events

| Event | When the alert is queued | Safe alert content |
| --- | --- | --- |
| Marketing opt-in | A public advertising lead submits the required contact-consent form, or a new non-test Meta/Zapier lead is created. | Lead name, phone, email, interest, and Facebook/Instagram source for staff follow-up. |
| Associate opt-in | An active Associate captures a consented lead in the Associate portal. | Safe lead ID and an instruction to review the protected Associate portal. |
| Associate enrollment activated | The hosted enrollment payment and subscription are provider-verified and Associate access is activated. | Safe enrollment reference and an instruction to review the protected Admin portal. |

## Active plain-text staff-text route

The live route is **DreamCarz outbox → server-only Zapier Catch Hook → authorized Dojo Flow Gmail → staff T-Mobile email-to-text gateways**. The published automation uses Gmail’s `Send Email` action with a **plain-text** body and HTML signature rendering disabled. The recipient gateway addresses and webhook URL are stored only in server-side configuration; they are not kept in source control, the database, or this document.

| Railway variable | Purpose |
| --- | --- |
| `STAFF_EMAIL_ALERTS_ENABLED` | Enables creation and delivery of the staff operational-alert outbox route. |
| `STAFF_EMAIL_ZAPIER_HOOK_URL` | Stores the HTTPS Catch Hook URL for the published staff-alert automation. |

The application accepts only HTTPS `hooks.zapier.com` hook URLs. The Zap delivers the approved Facebook/Instagram follow-up fields—name, phone, email, interest, and source—only to the configured staff recipients. It does not include payment data, account data, full form answers, or credentials.

## 2026-09-22 production validation

Railway accepted and deployed the two server-only staff-alert variables. A synthetic, no-customer-data marketing opt-in was accepted by the live DreamCarz API. The published Zap then recorded a successful Catch Hook step and a successful Gmail send step. The message settings recorded by Zapier were `plain` body type with HTML signature rendering set to `false`.

Both staff handsets confirmed receipt of the production test as plain text. Railway then successfully deployed the approved contact-detail alert update. A protected administrator replay reviewed **19 current non-test Facebook/Instagram leads** and queued **19** one-time staff deliveries. Zapier records the corresponding 19 current batch runs as successful, with the Gmail plain-text send action completing for each run. The replay uses a separate delivery variant, so it does not suppress any prior safe-reference test notification; repeating the replay does not create another contact-detail delivery for the same lead.

## Optional direct SMTP route

The application also contains an optional direct Gmail-to-T-Mobile SMTP implementation. It remains disabled unless a current mailbox-specific App Password and the private recipient gateway list are configured in Railway. It is not required for the currently active Zapier/Gmail route, and no normal Gmail password is used or stored by DreamCarz.
