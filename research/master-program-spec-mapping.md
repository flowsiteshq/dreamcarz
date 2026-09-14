# DreamCarz AI + DCP Master Specification Mapping

## Source

This implementation map is based on the user-supplied document at `/home/ubuntu/upload/Dream_Carz_AI_DCP_Master_Programmer_Specification_v1_3.pdf`, marked as version **1.3** and effective **September 11, 2026** in its document-control section.

## Implemented foundation

The active `DREAMCARZ_MASTER_2026_09_11` configuration stores the canonical effective-dated membership table, including enrollment fee, monthly fee, starting DCPR, multiplier, vehicle-access label, reference daily-rate ladder, per-day DCP requirement, and wallet streams. The active wallet taxonomy is DCPR, DCPM, DCPO, DCPW, DCPP, DCPF, and DCPE; DCPU is excluded.

The database now has versioned master configuration, versioned plan configuration, wallet definitions, and an append-only DCP ledger table. Configuring these records does **not** award DCP, post a payment, approve an enrollment, create a quote, alter a member balance, or settle a financial action.

## Explicitly retained safeguards

Vehicle-specific subscription rates, mileage, coverage, deposits, taxes, pass-through charges, vehicle contribution floors, Host settlement terms, payment processing, DCP reservation/redemption, CPP, commissions, and rank awards require their own approved configuration plus settled source events. Until that is in place, the application must keep final quote or financial action flows in manual review / not configured states and must not borrow external benchmark pricing.
