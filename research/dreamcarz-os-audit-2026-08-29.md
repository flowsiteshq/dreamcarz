# DreamCarz OS — Current-System Audit and Build Roadmap

**Assessment date:** 2026-08-29 EDT  
**Scope:** Existing DreamCarz website and member app, transaction overhaul, and the supplied DreamCarz OS master brief.  
**Build principle:** Preserve working public navigation, direct authentication, confirmed inventory presentation, existing transactions, and the premium white/black/gold visual language. Introduce the operating-system modules through additive schemas, protected routes, and explicit data migration boundaries.

## 1. Current application inventory

| Area | Current reusable foundation | OS gap to close | Recommended action |
| --- | --- | --- | --- |
| Public site and inventory | Public Fleet, vehicle details, Pricing, membership context, confirmed eight-vehicle presentation, and Coming Soon reserve labels are implemented. | Vehicle records are presentation-driven rather than normalized operational assets; vehicle availability must not be inferred from the current public catalog. | Preserve public catalog and add a protected Vehicle Passport layer before treating a vehicle as operationally available. |
| Authentication and account | Direct email/password registration, login, logout, opaque session cookies, and authenticated dashboard routes are in place. | Current roles are only `user` and `admin`; the OS requires customer, associate, fleet partner, delivery/operations, support, manager, and administrator boundaries. | Extend roles additively and migrate current users deliberately; replace scattered `role === admin` guards with named authorization helpers. |
| DreamCarz ID and onboarding | `customer_profiles`, rental application data, consent records, account-owned transaction records, private document access, and re-verification rules exist. | Phone/email verification, insurance verification, membership standing, wallet/ledger, rental/purchase history summaries, and account standing need a unified DreamCarz ID surface. | Evolve `customer_profiles` through additive fields and relation tables rather than replacing it. |
| Identity and driver verification | Front/back license and selfie capture, explicit document/biometric consent, private storage references, retention/deletion request, status states, and manual review are implemented. | No approved live identity provider is configured; the existing Stripe Identity adapter is inactive. | Keep manual-review fallback. Select and configure a compliant provider before enabling live checks. AWS Face Liveness is a researched alternative, but requires separate AWS identity/permission/privacy design. |
| Rental and purchase transactions | Separate rental/purchase transactions, staged progression, profile reuse, eligibility/insurance/additional-driver/trade-in inputs, condition reports, native agreement signing, and server-enforced vehicle release readiness exist. | Dates, pricing breakdown, funds/credits, membership rules, availability, pickup/delivery dispatch, swaps, rent-to-buy, return charges, and final invoices require normalized operating data. | Continue with transaction submodules and event-driven state changes; do not overload `vehicle_transactions` with every future domain. |
| Payments | CoCard Collect Checkout handoff, public checkout key, API-only server key, server-side Query API verification, one-time checkout attempts, and cross-transaction gateway-ID reuse protection are implemented. | CoCard merchant Webhooks is not exposed in the account options; payment calls are not end-to-end tested and no confirmed pricing/SKU matrix exists. | Preserve the safe Query API fallback; activate checkout only against approved pricing/SKUs and add signed asynchronous event handling after CoCard enables Webhooks. |
| Agreements | Native controlled templates, legal-approval reference, immutable versioning, customer acknowledgement/typed signature, integrity record, private signed artifact, and administrator evidence view are in place. | Templates are intentionally inactive until counsel approves agreement language, legal entity details, disclosures, and signing process. | Preserve current gate. Do not activate the supplied addendum until counsel resolves the Awesome Auto Group, Inc./Dream Carz, LLC entity inconsistency. |
| Operations and audit | Administrator transaction console, review states, transition checks, condition reports, document links, pricing review, and transaction event stream exist. | Command-center metrics, vehicle/fleet operations, delivery dispatch, incident management, wallet, pricing history, and role-specific queues are missing. | Build focused operating consoles on normalized data rather than one oversized dashboard. |
| Service and incidents | Service reports, secure photos, review status, and timeline history exist. | No structured accident/incident case tied to a specific transaction and vehicle; no roadside, police, tow, or insurance workflow. | Evolve the existing service-report foundation into an incident case module without deleting current reports. |
| Associates and partners | Referral profiles, referral attribution, ranks, commissions, partner directory, and an associate-facing dashboard foundation exist. | No strict Fleet Partner vehicle isolation, commission ledger event model, leads/application/conversion views, QR/business card, or customer journey attribution at transaction creation. | Add relationships and policy-scoped queries before expanding dashboards. |
| Concierge | A floating rule-based prompt exists and provides navigation. | It contains fixed account claims and operational promises, including a hardcoded Pro plan/payment state and stated response-time commitments. It cannot safely answer from live authorized data. | Replace fixed personal assertions first. Then add server-side, permission-filtered concierge tools that query only confirmed inventory, the current account, and live transaction status. |

## 2. Architecture decisions

### Preserve and extend

The current transactional core should remain the bridge between public vehicle selection and future operating modules. `customer_profiles`, `vehicle_transactions`, `transaction_documents`, `transaction_consents`, `transaction_agreements`, `vehicle_condition_reports`, and `transaction_events` already establish strong foundations for DreamCarz ID, private records, agreements, inspections, and auditability.

The native signing workflow should remain the only agreement flow. It is designed to be template-gated and avoids falsely claiming third-party e-sign completion. CoCard should remain the payment provider. DreamCarz must continue to avoid card capture, raw provider payload storage, raw biometric media in operating records, and automatic irreversible actions based on AI output.

### Introduce dedicated domain modules

The OS must not turn `vehicle_transactions` into a catch-all table. The next schemas should separate operational facts from customer-flow snapshots:

| New module | Core records | Why separate |
| --- | --- | --- |
| Vehicle Passport | `vehicles`, `vehicle_status_history`, `vehicle_documents`, `vehicle_media`, `vehicle_assignments` | Represents a physical asset, its identity, state, location, and readiness independently of a transaction. |
| Rental operations | `rentals`, `rental_extensions`, `vehicle_swaps`, `rental_delivery_tasks`, `rental_returns`, `settlement_items` | Supports a rental after it has been released, including time, dispatch, return, and settlement. |
| Wallet and ledger | `wallet_accounts`, `wallet_ledger_entries`, `payment_receipts`, `deposit_holds` | Provides append-only credits, refunds, deposit, and receipt history without silent balance edits. |
| Membership engine | `membership_plans`, `membership_benefits`, `customer_memberships`, `membership_events` | Makes benefits configurable and authoritative instead of deriving them from static UI copy. |
| Pricing engine | `pricing_rules`, `pricing_rule_versions`, `pricing_quotes`, `pricing_quote_lines`, `pricing_approvals` | Captures a transparent, approved price breakdown and pricing history. |
| Inspections and incidents | `inspection_templates`, `inspection_items`, `inspection_media`, `incident_cases`, `incident_events` | Provides structured before/after evidence and an incident workflow without automatically assigning fault or charges. |
| Fleet partnership | `fleet_partner_profiles`, `fleet_partner_vehicle_access`, `partner_payout_ledger` | Enforces vehicle-owner isolation and auditable data sharing/payouts. |
| Associate operations | `associate_profiles`, `lead_attributions`, `associate_commission_ledger`, `associate_assets` | Preserves attribution and avoids relying on a summary-only commissions table. |
| Communications | `communication_preferences`, `communications`, `communication_events` | Centralizes consent, delivery state, and history across email, SMS, push, and in-app messaging. |

## 3. Security and compliance-sensitive boundaries

| Boundary | Required control |
| --- | --- |
| Identity/biometric verification | Provider-based only; explicit separate consent; status/result minimization; manual fallback; no user-facing confidence score; privacy retention/deletion workflow; no homegrown facial-recognition decision. |
| Payments | CoCard-hosted data entry only; private key server-only; Query API verification; signed webhook when account feature is available; payment identifiers/minimal status only; never PAN, CVV, expiry, or raw gateway payloads. |
| Agreements | Counsel-approved immutable template required before activation; exact content snapshot; separate electronic-signature consent; typed signer identity, timestamp, integrity hash, private signed artifact, and audit event. |
| Role isolation | Least-privilege roles and organization/partner scoping at every procedure; customer, associate, partner, operations, support, manager, and administrator interfaces must not share unfiltered queries. |
| AI/automation | AI may summarize, route, and recommend on authorized data. It must not invent facts, declare eligibility/identity/payment status, set prices, charge customers, reject people, or take consequential actions without an authorized human decision. |
| Availability and finance | Inventory availability, rental rates, deposits, purchase prices, credits, payouts, commissions, finance approvals, and return charges require real source records and authorized approvals before display or action. |

## 4. Recommended build sequence

| Release | Scope | Dependencies |
| --- | --- | --- |
| **OS Foundation** | DreamCarz ID consolidation, named roles/authorization helpers, membership engine, wallet/ledger, Vehicle Passport schema, clear concierge-data boundary. | Existing direct authentication and transaction schema. |
| **Rental Operations** | Rental dates, availability/vehicle state, approved quote lines, membership benefits, extensions, rent-to-buy handoff, swap quote/review, pickup/delivery tasks, active rental dashboard. | Confirmed pricing matrix and vehicle operations data. |
| **Asset Care and Safety** | Guided inspections, incident cases, maintenance/status history, return/settlement records, vehicle processing queue. | Vehicle Passport and secure storage. |
| **Partner/Associate Operations** | Role-isolated partner vehicle portal, associate attribution/ledger/assets, manager reporting. | Role migration and entity relationships. |
| **Command Center and Communications** | Operational metrics, exception queues, communications history/preferences, controlled recommendations. | Reliable event/ledger/vehicle data. |
| **External Activation** | CoCard webhooks and controlled live payment QA; selected live identity provider; legal-approved templates. | CoCard Webhooks enabled, confirmed pricing/SKUs, provider credentials/policies, counsel approval. |

## 5. Immediate recommendations

1. **Do not rewrite existing pages.** Establish the data and role foundations behind the current app before adding new navigational complexity.
2. **Fix the concierge’s hardcoded account claims before presenting it as intelligent.** Until it reads authorized live data, it should provide only verified general guidance and clear routes.
3. **Treat Vehicle Passport, membership, wallet, and pricing as the first new durable OS modules.** They unlock the rental, partner, command-center, and customer experience without relying on made-up details.
4. **Keep real-world activation gated.** CoCard Webhooks, vehicle-specific pricing/SKUs, live biometric verification, and agreement templates require the identified external approvals/configuration.
5. **Expand roles before fleet-partner and operational dashboards.** The current binary role model cannot safely meet partner and staff access boundaries.

## 6. Audit conclusion

DreamCarz already has a credible transactional and account foundation. The right path is an additive modular build—not a visual rewrite and not a single giant table. The largest technical risks are falsely representing incomplete provider results, allowing static copy to impersonate live account facts, and exposing operational data without first expanding role isolation. The implementation sequence above keeps the current premium experience intact while producing authoritative records for the future DreamCarz OS.
