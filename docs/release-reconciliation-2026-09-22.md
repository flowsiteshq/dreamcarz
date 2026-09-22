# Release reconciliation — 2026-09-22

GitHub `main` had diverged from the validated local DreamCarz release. The verified local changes were reconciled and uploaded through the authenticated GitHub web interface in four commits: root release artifacts, server staff-alert code, the durable outbox migration/schema, and Drizzle migration metadata.

Local validation before release passed: `pnpm check`; focused `staffSms` and `metaLeadAds` tests; `pnpm build`; the separate retry-worker build; and `git diff --check`.

Railway observed the server-code-only commit fail to build because the schema export was not yet present in that intermediate commit. The immediately following migration/schema commit deployed successfully, and the subsequent metadata commit was building at the time of observation. No claim of production SMS delivery is implied by this release record.
