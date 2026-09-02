# TSD Web Capability Map for DreamCarz

## Public product findings

TSD’s public solutions page describes a connected fleet-rental operating system with fleet management, driver-license scanning, insurance-card capture, damage documentation, digital agreements, rate management, appointment management, delivery and collection, payment processing, fleet import, and scheduling integrations. It also describes telematics-based live fleet status, geofence alerts, toll and fuel workflows, trip history, reporting, and cross-location fleet visibility.

## DreamCarz implementation boundary

DreamCarz already has controlled inventory, protected license and insurance upload, condition reporting, agreements, manual eligibility and release gates, delivery and collection workflows, settlement review, and account-owned records. The highest-value internal expansion is a unified administrator command surface that brings existing controlled fleet, customer, DCP, review, and operations queues together.

Toll automation, fuel recoupment, payment collection, telematics, geofence alerts, mapping integrations, fleet imports, and external scheduling require separately approved provider, pricing, data-retention, and security decisions. They must remain clearly configured integrations rather than simulated capabilities.

## Phased DreamCarz roadmap

| TSD-style capability | DreamCarz status | Safe next increment |
| --- | --- | --- |
| Fleet command center and vehicle status | Existing controlled vehicle passports, service logs, incidents, handoff, and return queues | Consolidate those existing panels into a role-gated fleet operations workspace. |
| Customer and agreement records | Existing account-owned transaction, document, agreement, and audit paths | Add a minimized customer management queue with direct, audited transaction review links. |
| DCP program operations | Customer-facing DCP descriptions exist; no approved transactional DCP ledger or redemption policy is configured | Build only a DCP governance status panel until rules, ledgers, and approval controls are specified. |
| Reservation and appointment workflows | Existing requests, schedules, manual review, pickup, and delivery controls | Add a single operations calendar/queue view based only on recorded schedules. |
| Rate and payment management | Pricing rules and manual per-transaction review exist; no approved fleet pricing matrix or active CoCard SKU governance exists | Keep rate and payment controls configuration-gated and manual-review-led. |
| Digital agreements, identity, and condition evidence | Existing protected documents, native agreement process, liveness handoff, and condition evidence exist | Keep all approvals manual, data-minimized, and account owned. |
| Tolls, fuel, telematics, geofences, fleet import, accounting, and booking-channel integrations | Not configured | Add only after a separately approved provider, data-retention design, and implementation plan. |

## Additional sources

- https://tsdweb.com/car-rental-software/
- https://tsdweb.com/2024/02/06/tsd-launches-service-pickup-and-delivery/
- https://tsdweb.com/2018/08/06/7-tips-to-better-run-your-tsd-powered-fleet/

## Sources

- https://tsdweb.com/
- https://tsdweb.com/solutions/
