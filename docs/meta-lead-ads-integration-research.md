# Meta Lead Ads integration research

## Official implementation findings

Meta Lead Ads real-time synchronization uses a Page webhook subscribed to the `leadgen` field. A notification includes a `leadgen_id`, Page ID, form ID, ad group ID when available, ad ID when available, and lead creation time. DreamCarz must retrieve the full record separately through the Graph API using `leadgen_id`; the result includes the lead's `field_data` and attribution fields. [1] [2]

The documented permissions are `leads_retrieval`, `pages_manage_metadata`, `pages_show_list`, `pages_read_engagement`, `ads_management`, and `pages_manage_ads` when lead and ad-level data is required. The Page must subscribe the app to `leadgen` through the Page's `subscribed_apps` edge. [1] [2]

Meta verifies the callback endpoint with a GET request containing `hub.mode`, `hub.verify_token`, and `hub.challenge`. The server must validate the configured verification token and return the challenge. Event deliveries use the `X-Hub-Signature-256` header; DreamCarz should verify the HMAC-SHA256 signature against the raw request body with the Meta app secret before accepting an event. [3]

Meta may retry failed webhook deliveries, so the DreamCarz design requires a durable event ledger and lead-idempotency key. The recommended endpoint response is a rapid successful acknowledgement after the event has been persisted, with Graph retrieval and CRM processing executed through an idempotent retryable job. [3]

The Lead Ads Testing Tool can create and delete test leads for a selected Page and form. Meta documents one test lead per form at a time and provides a delivery-status view for debugging webhook arrival. [4]

## Dreamcarz app configuration audit — September 17, 2026

The existing Dreamcarz Meta app initially exposed only the **Create & manage ads with Marketing API** use case. On September 17, 2026, the approved **Capture & manage ad leads with Marketing API** use case was added through the Meta Developer dashboard. The addition did not open, modify, publish, activate, submit, or otherwise change the existing paid advertising campaign.

The newly configured use case exposes `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`, `pages_show_list`, `ads_management`, and `business_management` as **Ready for testing**. `pages_manage_metadata` is offered as an additional permission and is required for the planned Page webhook subscription. The next configuration step is to enable that permission and configure the secure callback only after the production endpoint and rotated server-only credentials are ready.

## Sources

[1] Meta, “Webhooks for Leads.” https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen/

[2] Meta, “Retrieving Leads,” updated May 21, 2026. https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving

[3] Meta, “Get started with webhooks.” https://developers.facebook.com/docs/graph-api/webhooks/getting-started/

[4] Meta, “Testing and Troubleshooting,” updated September 10, 2025. https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/testing-troubleshooting
