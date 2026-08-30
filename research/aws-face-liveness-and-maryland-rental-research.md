# DreamCarz Research — AWS Face Liveness and Maryland Rental Agreements

**Research date:** 2026-08-30 (EDT)  
**Status:** Planning material only. It does not activate biometric processing, set customer prices, or replace legal review.

## AWS Face Liveness

Amazon Rekognition Face Liveness uses an AWS Amplify SDK component, AWS SDKs, and cloud APIs. A server creates a liveness session, the client completes the guided short video-selfie session, and the server retrieves results. The result can include a 0–100 probabilistic liveness confidence score, a reference image, and up to four audit images. AWS states that liveness is not a guarantee and should be combined with other risk-based factors. [1]

The supported web integration uses the Amplify `FaceLivenessDetector`. AWS describes the Face Movement and Light challenge as the higher-accuracy option, while the face-movement option trades some accuracy for lower friction. Thresholds must be selected after testing against DreamCarz's own content and risk tolerance; no threshold should be hardcoded as an automatic eligibility decision. [1]

AWS lists Face Liveness as available in US East (N. Virginia), among other regions. The official US East pricing example lists the first 500,000 checks at **$0.015 per check**, followed by **$0.0125** for the next 500,000 checks; this excludes any other applicable application, storage, identity-document, or face-comparison costs. AWS says processed video may be stored and used to provide, maintain, and improve the feature unless the customer opts out. [2] [3]

**DreamCarz implementation recommendation:** keep the existing consent-first/manual-review workflow, create sessions only through an authenticated server endpoint, retain only approved audit metadata or protected evidence under a documented retention schedule, never store raw video in the DreamCarz database, and use an explicit non-biometric alternative/review queue for failure, accessibility, and opt-out cases. A face match to the license should be separately counsel/privacy reviewed; liveness alone does not prove identity.

At the disclosed US East first-tier rate, the Face Liveness service charge is **$1.50 for 100 checks**, **$7.50 for 500 checks**, **$15.00 for 1,000 checks**, **$75.00 for 5,000 checks**, and **$150.00 for 10,000 checks**. These are service-charge scenarios calculated as check count × $0.015, not an all-in identity-verification cost or a customer fee. [3]

## Preliminary Local Rental-Market Observations

Current public pages provide a directional, not directly comparable, Lanham/Washington-area benchmark. A Lanham car-rental listing showed a Chevrolet Malibu full-size rate of **$91/day** and intermediate sedans between **$41/day and $79/day**; its listed vehicles may be examples of a class rather than a guaranteed model. [10] A current local peer-to-peer result identified a 2020 Ford Fusion in Lanham at **$62/day**, while other Maryland Fusion listings in search results varied between $39/day and $49/day; rates are date-, host-, policy-, and availability-specific. [11] [12]

For SUVs, a local search result listed Chevrolet Equinox-or-similar at **$80/day** and a medium-SUV class at **$72/day** in Lanham. A Washington-area Equinox peer listing showed **$61/day** in Alexandria, and a reported Traverse offer outside the local market was **$95/day**; these are only directional anchors, not Maryland offers to reproduce. [13] [14] [15]

The benchmark evidence is intentionally not sufficient to set final customer pricing: it does not establish DreamCarz insurance economics, expected utilization, mileage, delivery, damage loss, taxes, authorized separate fees, seasonality, or the precise current condition and trim of each fleet vehicle. It should therefore inform a conservative test range only after owner approval and before administrative quotes/SKUs are created.

## Preliminary Daily Rental-Rate Recommendation — Owner Approval Required

**Basis:** proposed base day rates for a normal, non-peak rental day before Maryland rental tax, any permitted separately stated fee, optional protection, delivery, fuel/charge, mileage overage, or other future approved item. The recommendation anchors sedans below the $91/day local full-size class observation while recognizing the $62/day current Lanham Fusion peer listing; SUVs reflect the $61–$80 directional local Equinox anchors and a three-row SUV premium. [10] [11] [13] [14]

| Confirmed vehicle | Proposed base daily rate | Benchmark rationale | Approval state |
| --- | ---: | --- | --- |
| 2024 Chevrolet Malibu, gray | $69 | Newer full-size sedan; below observed $91 full-size class rate and above low-end peer Fusion listings. | **Proposed — not live** |
| 2022 Chevrolet Traverse, white | $89 | Three-row SUV; a modest premium to nearby compact/medium SUV directionals. | **Proposed — not live** |
| 2024 Ford Fusion, gray | $69 | Newer full-size sedan; balances the $62 Lanham Fusion peer listing with the local full-size class observation. | **Proposed — not live** |
| 2020 Chevrolet Traverse, gray | $84 | Three-row SUV; discounted to the newer Traverse while retaining its capacity-class premium. | **Proposed — not live** |
| 2019 Chevrolet Malibu, black | $59 | Older full-size sedan; positioned below the newer Malibu/Fusion proposal. | **Proposed — not live** |
| 2015 Ford Taurus, gray | $49 | Older full-size sedan; positioned close to the lower Maryland Fusion peer observations. | **Proposed — not live** |
| 2020 Chevrolet Equinox, gray | $74 | Compact/medium SUV; within the $61–$80 directional local Equinox/SUV observations. | **Proposed — not live** |
| 2020 Chevrolet Equinox, black | $74 | Same confirmed year/model baseline; condition, mileage, trim, and demand can justify a later approved difference. | **Proposed — not live** |

**Implementation decision:** these are recommendations, not prices in the current app. Before publishing or creating a CoCard product, DreamCarz should approve each rate; decide the daily-mileage allowance and every fee/deposit rule; confirm tax treatment; calculate any separately stated fee from actual eligible costs; map each approved charge to a CoCard product/SKU; and issue versioned quotes through the existing administrator flow.

## Maryland Agreement Redline — Draft for Counsel Review

> **Draft — for Maryland counsel review before adoption.** This is a product and implementation redline, not a legal conclusion or final rental agreement. It should not be entered as an approved DreamCarz agreement template until counsel confirms the entity, insurance structure, pricing disclosures, and records policy.

| Agreement area | Maryland-focused adjustment | DreamCarz implementation treatment |
| --- | --- | --- |
| Parties and vehicle | Identify the correct legal rental-company entity, registered agent, renter, authorized drivers, precise vehicle, agreed dates/times, pickup/delivery location, and contract reference. | Render from the transaction’s frozen snapshot; do not infer an entity name or VIN. |
| Insurance/security | Confirm the owner’s actual required-security approach and use the statutory face-of-agreement bold notice only if the applicable secondary-coverage model is actually being used. Maryland’s cited provisions prescribe the disclosure condition and 10-point bold requirement. [4] [5] | Keep insurance status manual-review/release-gated. Do not claim renter coverage is primary unless counsel/insurer confirms that model. |
| Price/tax/fees | State the approved base daily rate, rental period, taxes, and each separately stated charge clearly. Maryland’s short-term passenger-rental tax guidance identifies 11.5%; the agreement must not convert the fleet’s 3.5% acquisition excise tax into a renter line item. [6] [7] [8] | Generate only from an approved versioned quote. Keep all fees/TBD items out until approved and mapped. |
| Authorized use and drivers | Identify each authorized driver, license/eligibility status, permitted use, prohibited use, geographic restrictions, return obligations, and escalation contacts. | Use existing additional-driver, eligibility, incident, and return workflows; do not auto-approve an added driver from a form alone. |
| Condition, incidents, and settlement | Attach or reference pickup/return condition reports; explain reporting and human-review steps for damage, tolls, tickets, fuel/charge, cleaning, and settlement. | Preserve six-view evidence, human review, itemized adjustment review, and read-only customer settlement statement; do not promise a charge or refund outcome. |
| Privacy and biometrics | Place a separate, plain-language affirmative consent immediately before any live-selfie step. State purpose, provider, processing/retention/deletion rules, non-biometric alternative, support route, and no automatic sole decision. | Do not embed general biometric permission in the rental signature alone; keep provider inactive until configured. |
| Electronic signature | Include affirmative consent to transact electronically, a viewable final record, signer name/time/audit evidence, and a way to obtain the executed copy. Maryland’s UETA provision says electronic records/signatures cannot be denied effect solely because electronic. [16] | Retain the native signer’s acknowledgement, typed name, frozen rendered content, hash, timestamp, and private artifact. Counsel must still approve the exact process. |
| Adverse-event response | Set the operational channel for legal requests and preservation. Maryland law identifies certain written-request disclosure duties involving renters, authorized drivers, and insurer information after a reported adverse event. [9] | Route externally received requests to authorized staff; never expose these records through the member, partner, Associate, or public interface. |

## Maryland Agreement and Insurance Considerations

Maryland Transportation §18-102 requires proof of required security before a vehicle is registered for rental. The statute provides conditions under which an owner may use secondary coverage and requires specific **face-of-agreement, at least 10-point bold** disclosure language when relying on renter coverage in the stated circumstances. [4] COMAR 11.18.01.03 also describes filing/proof obligations and states that the owner policy or self-insurance must provide primary coverage in the regulatory circumstances described there. [5]

Maryland Transportation §18-108 permits narrowly defined separately stated fees for specified fleet titling/registration, government concession/facility, and governmental charges. Advertised rental rates must clearly disclose such authorized fees. The statute prescribes the description for the average titling-and-registration-cost fee in a rental agreement and requires a website statement for consumers in a qualifying extended-rental program. [6]

The Maryland Comptroller describes an **11.5% tax** on short-term passenger-car and recreational-vehicle rentals. Separately, an MVA bulletin says an excise tax of **3.5% of a rental vehicle's fair market value** applies effective July 1, 2025; that is an ownership/titling matter, not an authorization to add a customer fee. [7] [8]

Maryland Transportation §17-104.3 identifies rental-agreement-related information that may need to be provided in response to a written request following an adverse event, including renter/authorized-driver and primary-insurance information when the statutory conditions apply. The product's private retention and controlled disclosure model should remain, and counsel should set the actual legal-response workflow. [9]

**Agreement redline checklist for Maryland counsel:** identify DreamCarz's legal entity and registered agent; choose the actual insurance/primary-secondary coverage model and incorporate the exact statutory face-of-agreement disclosure if applicable; clearly itemize only permitted fees and the tax treatment; define authorized driver/use, vehicle-return, inspection, toll/ticket, damage, and dispute workflows; set electronic-signature consent/record-retention wording; and align privacy/biometric consent, retention, deletion, and incident disclosure procedures with counsel's instruction. Do not treat this checklist as a legal conclusion or deploy it as final agreement text without Maryland counsel review.

## Sources

[1]: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html "AWS — Detect face liveness"
[2]: https://aws.amazon.com/rekognition/face-liveness/ "AWS — Amazon Rekognition Face Liveness"
[3]: https://aws.amazon.com/rekognition/pricing/ "AWS — Amazon Rekognition pricing"
[4]: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=18-102 "Maryland Transportation §18-102"
[5]: https://regs.maryland.gov/us/md/exec/comar/11.18.01.03 "COMAR 11.18.01.03"
[6]: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=18-108 "Maryland Transportation §18-108"
[7]: https://services.marylandcomptroller.gov/taxes?id=kb_article_view&sysparm_article=KB0010148 "Maryland Comptroller — Special Situations"
[8]: https://mva.maryland.gov/your-mva-guide/businesses/bulletins-businesses/excise-tax-rental-vehicles "Maryland MVA — Excise Tax for Rental Vehicles"
[9]: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=17-104.3&enactments=false "Maryland Transportation §17-104.3"
[10]: https://www.carngo.com/car-rental/usa-lanham-under-25 "Carngo — Lanham vehicle-class listings"
[11]: https://turo.com/us/en/car-rental/united-states/lanham-md/ford/fusion/3474500 "Turo — 2020 Ford Fusion, Lanham listing"
[12]: https://turo.com/us/en/car-rental/united-states/lanham-md/ford "Turo — Ford rentals in Lanham"
[13]: https://www.uber.com/us/en/r/cities/lanham-md-us/ "Uber Rent — Lanham search result"
[14]: https://turo.com/us/en/suv-rental/united-states/alexandria-va/chevrolet/equinox/3474889 "Turo — Chevrolet Equinox, Alexandria listing"
[15]: https://turo.com/us/en/suv-rental/united-states/philadelphia-pa/chevrolet/traverse/3650658 "Turo — Chevrolet Traverse, Philadelphia listing"
[16]: https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=21-106 "Maryland Commercial Law §21-106"
