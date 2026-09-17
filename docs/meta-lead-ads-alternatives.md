# Meta Lead Automation Alternatives

## Context

The direct DreamCarz Meta webhook implementation is deployed but Meta currently rejects the configured Page request. This document records a supported automatic alternative that does not depend on the DreamCarz system-user token flow.

## Meta CRM Setup via Zapier

Meta Business Help documents **CRM Setup** within Business Suite’s Instant Forms area: open **All tools → Instant forms → CRM Setup**, then locate a CRM supported through Zapier.[^meta-crm]

Zapier documents Facebook Lead Ads as a trigger that can automatically send a new Facebook lead to another system immediately after submission.[^zapier-leads]

For DreamCarz, the destination would be a dedicated HTTPS endpoint in the existing production service. That endpoint would be independently authenticated, validate the Zapier payload, persist a durable event before processing, and reuse the existing New Meta Lead / attribution / duplicate / activity-timeline logic. It would not expose Meta credentials to the client and would not read, edit, publish, or activate Meta advertising.

| Approach | Automation | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- | --- |
| Meta Business Suite CRM Setup + Zapier to DreamCarz HTTPS endpoint | Real-time delivery after lead submission | Introduces Zapier as a delivery intermediary; requires a Zapier account/plan and one-time authorization to the Dreamcarz Page | Depends on Zapier plan | Low-to-medium; no Meta API token stored in DreamCarz |
| Correct the direct Meta API/Page-token connection | Real-time signed Meta delivery, native retry | One less vendor but Meta access configuration is currently blocking it | No intermediary charge | Medium-to-high; currently unresolved Meta authorization condition |
| Manual CSV import | Not automatic | Requires periodic export/upload | No intermediary charge | Low |

## Recommendation

Use **Meta Business Suite CRM Setup + Zapier → DreamCarz’s authenticated intake endpoint** as the fastest viable automatic path. Keep the existing direct Meta webhook implementation inactive as a future vendor-independent option. This approach needs a Zapier account connection and an approved one-time authorization in Meta, but it does not require modifying the existing paid campaign.

[^meta-crm]: [Meta Business Help — Connect your CRM system to Meta via Zapier](https://www.facebook.com/business/help/871411756318123)
[^zapier-leads]: [Zapier — Facebook Lead Ads integrations](https://zapier.com/apps/facebook-lead-ads/integrations)
