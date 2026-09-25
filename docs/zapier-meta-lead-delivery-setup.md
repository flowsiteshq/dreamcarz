# DreamCarz automated Meta lead delivery via Zapier


## Scope

This route imports Meta Instant Form leads into the existing DreamCarz **New Meta Lead** pipeline automatically. It does not create customer accounts, charge leads, send marketing, or change Meta campaigns. The paid Dreamcarz campaign remains **DRAFT and unmodified**.

## Security contract

The production receiver is `https://www.dreamcarz.io/api/integrations/zapier/meta-leads`. It requires HTTPS, JSON, the configured Dreamcarz Page ID, and a server-only static bearer secret. The secret must exist only in Railway and an encrypted Zapier connection. Never copy it into source code, a browser-visible webhook field, a test preview, log, screenshot, or this guide.

Use **API by Zapier → API Request**, not **Webhooks by Zapier → Custom Request**. Zapier documents that API by Zapier keeps API keys in an app connection, while Webhooks by Zapier stores credentials in the individual Zap step. [Zapier guidance](https://help.zapier.com/hc/en-us/articles/44391646192397-Ways-to-make-API-requests-in-Zapier)

The non-mutating connection check is `GET https://www.dreamcarz.io/api/integrations/zapier/meta-leads/connection`. With valid bearer authorization it returns only `{ connected: true, provider: "zapier" }`; it never returns lead, Page, form, or credential data.

## Railway configuration

| Variable | Required value | Handling |
| --- | --- | --- |
| `ZAPIER_META_LEAD_ADS_ENABLED` | `true` | Server feature gate |
| `ZAPIER_META_LEAD_INGEST_SECRET` | New random value, 32+ characters | Secret only; never display it |
| `META_PAGE_ID` | Existing Dreamcarz Facebook Page ID | Server allow-list |

Do not reuse any exposed or historic value. If a secret appears in a browser preview or log, invalidate it in Railway and Zapier before continuing.

## Zap configuration

1. Trigger: **Facebook Lead Ads (for Business admins) → New Lead**. Limit the connected account to the Dreamcarz Page and intended Instant Form(s).
2. Action: **API by Zapier → API Request**.
3. Connection: configure static API-key/header authentication privately as `Authorization: Bearer <fresh Railway secret>`. Create the encrypted connection with the endpoint above; do not place the bearer value in a Zap action field.
4. Request: `POST https://www.dreamcarz.io/api/integrations/zapier/meta-leads`, content type `application/json`.
5. Map `lead_id`, `page_id`, `form_id`, `form_name`, `created_time`, `full_name`, `email`, `phone_number`, service interest, all available campaign/ad-set/ad fields, and every custom/disclaimer answer exposed by the Meta trigger.

The receiver persistently stores the source event first, processes it immediately, and uses the existing retry worker for recoverable failures. It deduplicates by Meta Lead ID first, then normalized contact data; a duplicate delivery cannot create a second marketing lead, source record, or creation activity.

## Required controlled validation

Before enabling the Zap, verify the encrypted connection, then deliver one controlled Meta test lead. Confirm in DreamCarz that the durable event has `deliverySource=zapier`, one marketing lead is at **New Meta Lead**, contact data/form answers/attribution are present, timeline activity was created, and retry state is clear. Replay that same Meta Lead ID exactly once to prove it is acknowledged as a duplicate without creating a second record. Then stop: do not publish, activate, edit, or otherwise alter the paid Meta campaign.
