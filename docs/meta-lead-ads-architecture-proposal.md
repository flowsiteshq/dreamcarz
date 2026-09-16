# DreamCarz Meta Lead Ads Integration — Architecture Proposal

**Status:** Approval required. This document proposes a design only. It does not add database tables, configure Meta, create a test lead, change production, or deploy code.

## Executive decision

DreamCarz currently has several **separate** records that hold customer-related information, but it does not yet have a global, administrator-operated marketing-lead pipeline. The public `advertising_leads` table is a narrow landing-page intake record with name, email, phone, consent, source, and a reference. It does not deduplicate, retain Meta attribution or custom responses, create activities, or provide an administrator CRM view. `associate_leads` is explicitly associate-owned and private, while `vehicle_inquiries` and `vehicle_transactions` represent later, vehicle-specific requests and signed-in customer journeys.

The proposed integration is therefore **additive**: introduce a small global marketing-lead layer that becomes the canonical lead and activity record for Meta and future public marketing sources. It will link to—not replace—the existing public advertising lead records, vehicle inquiries, and signed-in customer records when a relationship is known. This avoids treating an Associate’s private leads as a company-wide CRM and avoids prematurely converting an ad prospect into a customer account.

## Proposed flow

```text
Meta Instant Form submission
        |
        v
POST /api/meta/lead-ads/webhook
  - raw-body HMAC verification
  - Page allow-list validation
  - durable, idempotent inbox record
        |
        | 200 response after durable receipt
        v
Database-backed processing job
  - retrieve lead data from Graph API by leadgen_id
  - normalize / validate mapped contact fields
  - preserve field_data + custom disclaimer responses
  - deduplicate and create activity
        |
        +--> existing global lead: append inquiry/activity
        |
        +--> existing signed-in customer: link as known contact, no duplicate customer account
        |
        +--> no match: create global lead in New Meta Lead stage
        v
Admin: Customers / Lead Pipeline + Integrations / Meta Lead Ads
```

Meta sends a Page `leadgen` notification containing identifiers and timestamps, but DreamCarz must retrieve the full lead record using `leadgen_id`; this is where `field_data` and custom answers are obtained. [1] [2]

## Data model: additive records

The names below are proposed. Exact migration syntax and indexes will be finalized only after approval.

| Proposed table or extension | Purpose and minimum fields | Deduplication and privacy design |
|---|---|---|
| `marketing_leads` | Canonical global prospect record: `id`, `stage` (`new_meta_lead`, `new`, `contacted`, `qualified`, `converted`, `closed`), display name, protected email/phone, normalized email/phone lookup values, consent basis, optional linked `userId`, `firstSeenAt`, `lastActivityAt`, timestamps. | Meta lead IDs are **not** put here. Email/phone lookup values are normalized and indexable; access remains admin-only. A new lead is not a DreamCarz account or transaction. |
| `marketing_lead_activities` | Immutable timeline: `marketingLeadId`, event type such as `meta_lead_received`, actor type, safe summary, source record ID, timestamp. | Timeline stores a safe summary and identifiers—not raw tokens or entire raw third-party payloads. |
| `meta_lead_integrations` | One controlled connection record per Page: enabled/status, Page ID/name, app/version metadata, last successful lead timestamp, last checked timestamp, last safe error code/category, configuration owner/updated timestamps. | **Never** stores app secret or Page token. Those remain server-only environment secrets. |
| `meta_lead_forms` | Page-scoped form metadata: integration ID, Meta form ID/name, active/subscribed status, last seen timestamp. | Supports the admin subscribed-form display without exposing credentials. |
| `meta_lead_events` | Durable inbound inbox/job: webhook fingerprint, `leadgenId` **unique**, Page/form/ad set/ad IDs, provider created time, receipt timestamp, processing state, attempt count, next-attempt time, safe error category, processed timestamp, payload digest/minimized structural metadata. | One row per Meta lead ID makes repeated Meta deliveries harmless. No raw access token, secret, or broad raw PII logging. |
| `meta_lead_records` | Source detail linked to global lead: Meta lead ID unique, marketing lead ID, form/page/campaign/ad set/ad IDs, source placement when available, submitted timestamp, field data JSON, custom disclaimer response JSON, mapped interest. | Preserves all permitted custom answers in structured JSON, bounded by size and rendered as escaped text. Sensitive/unexpected questions are stored only if required, never copied to logs. |
| Compatibility link on `advertising_leads` | Nullable `marketingLeadId` (or a separate relation table) for landing-page records. Existing capture stays functional. | Future public landing-page capture can reuse the same normalization/deduplication service rather than continue unconditional inserts. Existing rows need no destructive migration. |

### Dedupe rule

Processing is deterministic and transaction-safe. The precedence will be:

1. **Exact Meta Lead ID**: if `meta_lead_records.metaLeadId` already exists, the delivery is recorded as duplicate/idempotent and no new contact or activity is created.
2. **Normalized phone**, then **normalized email**: search `marketing_leads` first and then existing eligible contact-bearing records that can be safely linked. When matched, append a `meta_lead_received` activity and a separate Meta attribution record; do not create a second customer/prospect.
3. **No match**: create a global `marketing_leads` record in **New Meta Lead** and create its initial timeline event.

If phone and email point to different pre-existing entities, the job will **not auto-merge people**. It will enter a controlled `manual_review` state with a safe error/exception record. This prevents an incorrect customer merge.

### Attribution and custom answers

The lead profile will display a compact attribution panel such as:

> **Source:** Meta Lead Ads — Facebook or Instagram when returned by Meta.  
> **Campaign:** resolved campaign label/ID when available.  
> **Form:** resolved form label/ID.  
> **Interest:** a mapped supported answer, for example Rent, Buy, or Membership, while retaining the original answer set below it.

The raw `field_data` answer structure and separately returned `custom_disclaimer_responses` are retained in the protected source-detail record. Meta documents that custom disclaimer responses are not included in `field_data` and require a separate requested field. [2]

## Webhook and synchronization design

The endpoint will be `https://www.dreamcarz.io/api/meta/lead-ads/webhook`. It will be registered before the application-wide JSON parser, mirroring the existing secure payment-webhook ordering. The GET endpoint will only return the `hub.challenge` when `hub.mode=subscribe` and the received token matches `META_WEBHOOK_VERIFY_TOKEN`. Meta requires an HTTPS endpoint with valid TLS, and its verification handshake uses those exact parameters. [3]

The POST endpoint will accept only `application/json` raw bytes. Before parsing, it will require an `X-Hub-Signature-256` header beginning with `sha256=`, calculate HMAC-SHA256 with `META_APP_SECRET`, and compare the digest using a timing-safe comparison. Invalid signatures receive a generic 401/403-style rejection; no payload detail is logged. Meta describes this signature format and recommends verification. [3]

After signature verification, DreamCarz will enforce a configured Page ID allow-list, inspect only `object: page` and `field: leadgen` changes, and persist each lead event transactionally. It then returns HTTP 200 promptly. This acknowledges delivery without making Meta wait on Graph API retrieval or lead processing. Meta can batch updates and retry delivery when requests fail, so the durable inbox and unique `leadgenId` are essential. [3]

### Retry, recovery, and reconciliation choices

| Approach | How it works | Trade-offs | Cost / setup |
|---|---|---|---|
| **Recommended: durable inbox plus scheduled retry** | Each signed webhook is persisted; a short, idempotent scheduled handler processes due records with exponential backoff, bounded attempts, and `manual_review` after exhaustion. | Survives restarts and temporary Meta/database failures; adds a small job table and a scheduled handler. | Uses the existing deployed DreamCarz service and database. No continuously running worker is required. |
| **Simpler: process inline with provider retries only** | Webhook fetches the lead and writes the CRM record before responding. | Less code but risks delayed acknowledgements, repeated work, and lost internal retry control. Not recommended for production lead capture. | Lowest setup, weaker reliability. |
| **Optional later: periodic reconciliation** | An administrator-triggered or scheduled bulk-read identifies leads absent from `meta_lead_records`. | Useful as a safety net, but needs careful Page/form scoping and rate-limit controls; it is not a substitute for signed webhooks. | Additional configuration and monitoring. |

The approved recommendation uses the first option. It does **not** use an in-memory timer, which would be unreliable on a request-scaled deployment. Retry state lives in the database; a scheduled authenticated handler reads only due records, applies exponential backoff, and is idempotent. Reconciliation is deferred until the base flow is operating and data-retention requirements are confirmed.

## Admin user experience

The existing administrator portal already protects staff access and has customer and operations navigation. After approval, it will gain an **Integrations** navigation item and a concrete **Meta Lead Ads** workspace rather than overloading the existing generic operations screen.

| Surface | Proposed behavior |
|---|---|
| **Integrations → Meta Lead Ads** | Shows enabled/disabled state, connected Page name and ID, subscribed forms, Graph API version, last successful lead time, last verified receipt time, delayed/failed job count, and a safe error summary. Tokens and secrets are never displayed. |
| **Reconnect / configuration review** | Starts a protected server-side configuration check or displays the required Meta connection steps. It cannot reveal or prefill a Page token. Any action that changes Meta Page subscription stays confirmation-gated. |
| **Retry now** | Allows an authorized administrator to request processing of a failed event, retaining the audit trail. It cannot bypass signature validation or invent event data. |
| **Test integration** | Presents a confirmation before asking Meta to create a test lead, then tracks the specific returned lead through durable receipt, source record, dedupe decision, activity, and admin status. The Meta Testing Tool remains an alternative manual test route. |
| **Lead profile / Customers** | Shows stage `New Meta Lead`, source and attribution, mapped interest, protected custom-answer panel, and an immutable “Meta lead received” timeline entry. |

Meta’s test API can create a lead using `/{FORM_ID}/test_leads` with a Page access token; only one test lead per form can exist at a time until it is deleted. These test leads are not associated with an ad. [4]

## Meta app and operational prerequisites

Meta Page lead webhook delivery requires a Page webhook subscription to `leadgen`, a Page access token from a person who can advertise on the Page, and Page app installation through `/{PAGE_ID}/subscribed_apps?subscribed_fields=leadgen`. [1]

| Required permission or control | Why DreamCarz needs it |
|---|---|
| `leads_retrieval` | Retrieve full Instant Form lead data. |
| `pages_show_list` and `pages_read_engagement` | Locate and read the connected Page context. |
| `pages_manage_metadata` | Subscribe the Page/application to the `leadgen` webhook field. |
| `ads_management` and `pages_manage_ads` | Retrieve campaign/ad-level attribution when Meta makes it available. |
| Meta Lead Access Manager authorization | Required where Page lead access has been customized by the business. |
| Live Meta app, App Review, and Business Verification as required | External non-app-role leads require the appropriate Meta access state. Development-mode access is limited to people with app roles. [5] |

### Server-only environment variables

Only variable **names** are listed here. No values should be committed, surfaced in the browser, stored in activity records, or repeated in documentation.

| Environment variable | Use |
|---|---|
| `META_APP_ID` | Meta app identity for diagnostics/configuration checks. |
| `META_APP_SECRET` | HMAC validation of webhook deliveries; server only. |
| `META_WEBHOOK_VERIFY_TOKEN` | Compares Meta’s GET verification request; server only. |
| `META_PAGE_ACCESS_TOKEN` | Retrieves leads, forms, Page subscription state, and test leads; server only. Long-lived Page-token lifecycle and rotation need an approved owner/process. |
| `META_PAGE_ID` | Enforced Page allow-list and connection identity. |
| `META_GRAPH_API_VERSION` | Pinned Graph API version to avoid unreviewed behavior drift. |
| `META_LEAD_ADS_ENABLED` | Explicit operational kill switch for retrieval/processing without changing schema. |

An additional secret-store entry can be added only after approval. The live callback must be configured in the Meta app as `https://www.dreamcarz.io/api/meta/lead-ads/webhook`; production callback configuration and token entry are external operational changes and are excluded from this design phase.

## File and service changes after approval

| File or service | Proposed change |
|---|---|
| `drizzle/schema.ts` | Add global marketing lead, activity, Meta integration/form/event/source-detail records and compatible landing-page link. |
| `drizzle/migrations/*` and database migration | Generate and apply additive, indexed migration after review. No existing lead table is dropped or replaced. |
| `server/metaLeadAdsWebhook.ts` (new) | Raw Meta GET/POST endpoint, verification, HMAC validation, inbox persistence, safe status boundaries. |
| `server/metaLeadAdsService.ts` (new) | Graph retrieval, field mapping, dedupe, attribution, activity creation, bounded retry logic. |
| `server/metaLeadAdsRetry.ts` (new) | Authenticated scheduled processing of due durable events; no in-process timer. |
| `server/_core/index.ts` | Register the raw Meta route before JSON parsing and the scheduled retry handler before the application fallthrough. |
| `server/db.ts` and/or focused server modules | Query helpers that preserve existing tRPC patterns. |
| `server/routers.ts` or a focused `server/routers/metaLeadAds.ts` | Admin-only status, form list, retry, and test integration procedures. The webhook itself is not a public tRPC route. |
| `client/src/pages/AdminPortal.tsx` and new focused admin components | Add the Integrations navigation entry, Meta status/test/retry workspace, and global marketing-lead customer view. |
| `client/src/pages/GetStarted.tsx` plus its capture procedure | Retain current behavior initially; optionally route future captures into the canonical dedupe service while preserving the existing opaque handoff. |
| `server/*.test.ts` | Unit/integration coverage for GET handshake, malformed/missing signatures, timing-safe verification, Page allow-list, batched events, idempotency, duplicate by phone/email, conflicting matches, retries, safe errors, and admin access. |
| Secret configuration and Meta app dashboard | Add only approved secrets; configure callback, Page `leadgen` subscription, Lead Access Manager, and app-review/live-state prerequisites. |

## Rollout and acceptance tests

Implementation will be staged to prevent silent lead loss. First, migration and local tests establish the inbox and mapping behavior. Next, server-only configuration validates the GET handshake and signed POST processing in a protected environment. Then an administrator uses either the DreamCarz test action or the Meta Lead Ads Testing Tool to create one controlled test lead. The test is accepted only if the administrator can see: the durable receipt, one source record, the expected stage, correct attribution/custom answers, an activity entry, and a correct dedupe result on repeated delivery.

No paid campaign needs to be published for this test. Meta states that testing-tool leads are organic and not attached to an ad. [4]

## Explicit non-goals for this approval

This design does not modify the unverified Meta paid-ad draft, submit an ad, change AdRoll, create a customer account, store payment data, create a rental/purchase transaction, subscribe anyone to marketing outside the form’s stated consent, or automatically merge conflicting people. It also does not send CRM outcomes back to Meta through Conversions API; that is a separate decision with its own consent, legal, and technical review.

## Approval requested

Please confirm approval for all four items below before implementation begins:

1. **Architecture:** introduce the additive global `marketing_leads` / activities / Meta source-detail / durable-event model rather than using Associate-owned leads or replacing existing customer tables.
2. **Operations:** use a signed raw webhook with a database-backed retry queue, and defer bulk reconciliation to a later optional phase.
3. **Access:** add the listed server-only environment variable names and configure the Meta app/Page subscription, App Review/Business Verification, and Lead Access Manager as needed.
4. **Production and testing:** deploy the approved code, configure the callback URL, and create one controlled Meta test lead after configuration.

## References

[1] [Meta, “Webhooks for Leads.”](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen/)

[2] [Meta, “Retrieving Leads,” updated May 21, 2026.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving)

[3] [Meta, “Get started with webhooks.”](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/)

[4] [Meta, “Testing and Troubleshooting,” updated September 10, 2025.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/testing-troubleshooting)

[5] [Meta, “Lead Ads,” updated May 21, 2026.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads)
