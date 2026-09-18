# DreamCarz Automated Meta Lead Delivery via Zapier

## Purpose and scope

This delivery route receives new Meta Instant Form leads through Zapier and imports them into the existing DreamCarz marketing-lead pipeline. It is an **automatic delivery mechanism** only. It does not create a DreamCarz customer account, charge a lead, send a marketing message, or alter a Meta campaign. The existing paid Meta campaign remains **DRAFT and unmodified**.

Meta documents this pattern as **Business Suite → All tools → Instant forms → CRM Setup → Zapier**. Zapier’s Facebook Lead Ads integration supplies a **New Lead** trigger after an Instant Form submission.[^meta-zapier][^zapier-fbla]

## Security design

The production lead receiver is `https://www.dreamcarz.io/api/integrations/zapier/meta-leads`. It accepts only HTTPS JSON requests with a separately generated static bearer secret. The secret is stored only in Railway and a protected **API by Zapier app connection**; it must never be placed in a Webhooks by Zapier step field, repository, client code, logs, screenshots, browser output, or the DreamCarz administrator UI.

Zapier’s own product guidance distinguishes these routes: **Webhooks by Zapier** stores credentials inside plain Zap step setup, while **API by Zapier** stores API keys in an app connection. The latter is required here because it redacts the credential at runtime.[^zapier-api-security]

The authenticated non-mutating connection check is `GET https://www.dreamcarz.io/api/integrations/zapier/meta-leads/connection`. It returns only `{ connected: true, provider: "zapier" }` after a valid bearer check. It does not return customer data, Page/form identifiers, or any secret.

An accepted lead request is immediately written to DreamCarz’s durable `meta_lead_events` inbox with its Meta Lead ID as a unique key. It is then processed into the existing **New Meta Lead** pipeline. The same job-safe retry worker can later recover an interrupted delivery. Repeated deliveries with the same Meta Lead ID return a successful duplicate result and do not create a second marketing lead, source record, or creation activity.

The route rejects missing or wrong bearer authentication before parsing a payload. It accepts only the configured Dreamcarz Page ID, requires a Meta Lead ID and Instant Form ID, bounds saved payload size, and preserves supplied custom form responses as protected source data.

## Required Railway variables

| Variable | Value | Visibility |
| --- | --- | --- |
| `ZAPIER_META_LEAD_ADS_ENABLED` | `true` | May be visible as a feature flag. |
| `ZAPIER_META_LEAD_INGEST_SECRET` | A newly generated random value of at least 32 characters. | Secret; never display or commit it. |
| `META_PAGE_ID` | The existing Dreamcarz Page ID, already configured for the integration. | Server-only identifier. |

`ZAPIER_META_LEAD_INGEST_SECRET` must match the protected API by Zapier connection. It is independent of all Meta app, Page-token, webhook, and retry secrets. Do not reuse any of those values. If a value is displayed in a browser, a test preview, or a log, immediately delete/replace it in both systems before proceeding.

## Zapier configuration contract

Create one Zap using the existing Dreamcarz Meta account/Page only:

1. **Trigger:** `Facebook Lead Ads (for Business admins)` → `New Lead`; select the Dreamcarz Facebook Page and the intended Instant Form(s). This does not edit, publish, activate, target, or otherwise alter an ad campaign.
2. **Action:** `API by Zapier` → `API Request`. Do **not** use `Webhooks by Zapier → Custom Request` for this authenticated delivery.
3. **Connection:** create or select a DreamCarz API-by-Zapier connection using the API-key/static-header option. Set header name `Authorization`; privately enter `Bearer <the fresh Railway secret>` only in the connection’s password/API-key field. Confirm the connection by calling the non-mutating connection URL above. Zapier must redact the value; if it displays the value, cancel and do not save it.
4. **Method:** `POST`.
5. **URL:** `https://www.dreamcarz.io/api/integrations/zapier/meta-leads`.
6. **Content type:** JSON (`application/json`).
7. **Payload:** map the required fields below, including every custom question and custom disclaimer response exposed by the Facebook Lead Ads trigger. If a form field is later added, add it to the mapping before advertising begins.

| DreamCarz JSON key | Required | Zapier Facebook Lead Ads value |
| --- | --- | --- |
| `lead_id` | Yes | Facebook Lead ID / Lead ID |
| `page_id` | Yes | Facebook Page ID |
| `form_id` | Yes | Form ID / Instant Form ID |
| `form_name` | Recommended | Form Name |
| `created_time` | Recommended | Created Time |
| `full_name` | Recommended | Full Name; otherwise map `first_name` and `last_name` |
| `email` | Recommended | Email |
| `phone_number` | Recommended | Phone Number |
| `interest` | Recommended | DreamCarz service/vehicle interest question |
| `campaign_id`, `campaign_name` | Recommended when provided | Campaign fields |
| `adset_id`, `adset_name` | Recommended when provided | Ad Set fields |
| `ad_id`, `ad_name` | Recommended when provided | Ad fields |
| `custom_answers` or individual named fields | Yes, if shown by the form | Every custom Instant Form response |
| `custom_disclaimer_responses` | Yes, if shown by the form | Every custom disclaimer response |

The intake accepts either a structured `field_data`/`custom_answers` array or named JSON fields. All named non-attribution fields are retained as protected custom answers. Use `is_test: true` only for a controlled test delivery.

## Verification plan

Before advertising begins, validate the encrypted API by Zapier connection with its non-mutating connection check. Then use Zapier’s test trigger/action once with a controlled Meta test lead and verify the administrator-only DreamCarz **Integrations → Meta Lead Ads** workspace shows the durable inbox event, one marketing lead at **New Meta Lead**, contact data, form/custom answers, attribution, and timeline. Repeat the identical delivery once to verify a duplicate is acknowledged without creating another marketing lead or source record. Only after those checks succeed may the Zap be turned on. Stop after those checks; do not publish or modify the paid campaign.

[^meta-zapier]: [Meta Business Help: Connect your CRM system to Meta via Zapier](https://www.facebook.com/business/help/871411756318123)
[^zapier-fbla]: [Zapier: Facebook Lead Ads integrations](https://zapier.com/apps/facebook-lead-ads/integrations)
[^zapier-api-security]: [Zapier Help: Ways to make API requests in Zapier](https://help.zapier.com/hc/en-us/articles/44391646192397-Ways-to-make-API-requests-in-Zapier)
