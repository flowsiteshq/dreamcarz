# DreamCarz Automated Meta Lead Delivery via Zapier

## Purpose and scope

This delivery route receives new Meta Instant Form leads through Zapier and imports them into the existing DreamCarz marketing-lead pipeline. It is an **automatic delivery mechanism** only. It does not create a DreamCarz customer account, charge a lead, send a marketing message, or alter a Meta campaign. The existing paid Meta campaign remains **DRAFT and unmodified**.

Meta documents this pattern as **Business Suite → All tools → Instant forms → CRM Setup → Zapier**. Zapier’s Facebook Lead Ads integration supplies a **New Lead** trigger after an Instant Form submission.[^meta-zapier][^zapier-fbla]

## Security design

The production endpoint is `https://www.dreamcarz.io/api/integrations/zapier/meta-leads`. It accepts only HTTPS JSON requests with a separately generated static bearer secret. The secret is stored only in Railway and Zapier, never in the repository, client code, logs, or the administrator UI.

An accepted request is immediately written to DreamCarz’s durable `meta_lead_events` inbox with its Meta Lead ID as a unique key. It is then processed into the existing **New Meta Lead** pipeline. The same job-safe retry worker can later recover an interrupted delivery. Repeated Zapier deliveries with the same Meta Lead ID return a successful duplicate result and do not create a second marketing lead, source record, or creation activity.

The route rejects missing or wrong bearer authentication before parsing a payload. It accepts only the configured Dreamcarz Page ID, requires a Meta Lead ID and Instant Form ID, bounds saved payload size, and preserves supplied custom form responses as protected source data.

## Required Railway variables

| Variable | Value | Visibility |
| --- | --- | --- |
| `ZAPIER_META_LEAD_ADS_ENABLED` | `true` | May be visible as a feature flag. |
| `ZAPIER_META_LEAD_INGEST_SECRET` | A newly generated random value of at least 32 characters. | Secret; never display or commit it. |
| `META_PAGE_ID` | The existing Dreamcarz Page ID, already configured for the integration. | Server-only identifier. |

The `ZAPIER_META_LEAD_INGEST_SECRET` must match the bearer value configured in Zapier. It is independent of all Meta app, Page-token, webhook, and retry secrets. Do not reuse any of those values.

## Zapier configuration contract

Create one Zap using the existing Dreamcarz Meta account/Page only:

1. **Trigger:** `Facebook Lead Ads` → `New Lead`; select the Dreamcarz Facebook Page and the intended Instant Form. This does not edit, publish, activate, target, or otherwise alter an ad campaign.
2. **Action:** `Webhooks by Zapier` → `Custom Request` (or its current equivalent).
3. **Method:** `POST`.
4. **URL:** `https://www.dreamcarz.io/api/integrations/zapier/meta-leads`.
5. **Headers:** `Content-Type: application/json` and `Authorization: Bearer <the same private Railway secret>`.
6. **Payload Type:** JSON.
7. **Map the required fields** listed below. Map every custom question and custom disclaimer response exposed by the trigger. If a custom field is later added to the form, add it to this Zap mapping before advertising begins.

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

Before advertising begins, use Zapier’s test trigger/action once with a controlled Meta test lead, then verify the admin-only DreamCarz **Integrations → Meta Lead Ads** workspace shows the durable inbox event, one marketing lead at **New Meta Lead**, contact data, form/custom answers, attribution, and timeline. Repeat the identical delivery once to verify a duplicate is acknowledged without creating another marketing lead or source record. Stop after those checks.

[^meta-zapier]: [Meta Business Help: Connect your CRM system to Meta via Zapier](https://www.facebook.com/business/help/871411756318123)
[^zapier-fbla]: [Zapier: Facebook Lead Ads integrations](https://zapier.com/apps/facebook-lead-ads/integrations)
