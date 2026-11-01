# Hirevoxa — Phase 2B Data Cleanup & Security Report

**Date:** 2026-10-27<br>
**Phase status:** **BLOCKED**

## Executive result

Phase 2B security work was executed through the available environment, but Phase 2B cannot pass because no MongoDB URI or reachable MongoDB server is configured. The application now fails safely during normal direct startup instead of silently serving an in-memory demo marketplace. The existing explicit in-memory adapter remains available only to the test suite or when a non-production operator sets `ALLOW_IN_MEMORY_DEMO=true`.

## Data-source inventory

### Confirmed explicit demo sources

- `server/src/seed/seedData.js`: six hardcoded candidate profiles, four jobs, and two interviews, all marked `isDemoRecord: true`.
- `server/src/services/inMemoryStore.js`: demo users, seeded candidates/jobs/interviews, seeded shortlists, seeded messages, and generated records.
- `server/src/seed/seed.js`: optional MongoDB demo seeding command.
- Historical client fallbacks: `JobsTable`, `RecommendationHero`, `RecommendedPage`, `InterviewsPage`, `MessagesPage`, `ReportsPage`, and `HeaderProfile` contained hardcoded records, IDs, metrics, or success fallbacks. Current changes remove or gate the audited production-facing fallbacks and show honest empty/error states.

### Safe classification

These records are not proven real business records. They are retained for isolated tests and explicit demonstration mode. No configured database was available, so no database records were inspected or deleted.

## Changes implemented

- `server/src/config/db.js`
  - Normal startup requires `MONGODB_URI`.
  - Connection failure does not silently fall back unless `ALLOW_IN_MEMORY_DEMO=true`.
  - Test mode explicitly enables the adapter through `server/tests/setup.js`.
- `server/src/server.js`
  - Direct startup awaits database initialization and exits with a fatal configuration error before listening when required configuration is missing.
- `.env.example` and `README.md`
  - Document MongoDB as required outside tests and document explicit demo switches.
- `server/src/seed/seed.js`
  - Refuses to run without MongoDB and explicit `ALLOW_DEMO_SEED=true`.
- `server/src/services/migrationService.js`
  - Requires verified company ownership for legacy reassignment.
  - Quarantines ambiguous records instead of assigning them to a guessed company.
- `server/src/services/dataCleanupService.js`
  - Added dry-run provenance plan, dependency-aware record collection, mandatory backup path, explicit confirmation, and deletion only after review.
- `server/src/models/QuarantineRecord.js`
  - Added durable quarantine metadata for ambiguous legacy records.
- `server/src/routes/matchRoutes.js` and matching controller
  - Recommendations now require an authorized company/admin and are tenant-scoped.
  - Empty open-job results no longer fabricate a score.
- `server/src/routes/messageRoutes.js`
  - Message creation requires explicit conversation and recipient IDs; fabricated defaults were removed.
- `server/src/routes/reportRoutes.js`
  - Candidate metrics are limited to public/active candidates rather than every candidate record.
- Client dashboard/recruiter pages
  - Removed fabricated count defaults, report metrics, job rows, recommendation candidates, contact defaults, and API-failure success behavior in audited paths.

## Cleanup evidence

- Cleanup was **not executed**.
- Reason: no MongoDB URI/server is available, so there are no database records to inspect safely.
- No collections were dropped, no users were deleted, and no production-like data was modified.
- The cleanup service requires a reviewed plan, a caller-provided backup directory, and `confirm=true` before destructive work.

## Actual tests and checks

- `server/npm test`: **118 passed, 0 failed, 0 skipped** across 10 suites (including DB config layer, credential masking, production gating, duplicate connection guard, and tenant isolation).
- `client/npm run build`: **PASS** (Vite v8.3.4, exit code 0).
- `client/npm run lint`: **PASS** (oxlint exits code 0 with 51 warnings and 0 errors).
- Direct normal startup without MongoDB:
  - Command: `node -e "..."` with `ALLOW_IN_MEMORY_DEMO=false` and missing `MONGODB_URI`.
  - Actual result: exit code **1** with `[Hirevoxa DB Config Error] Missing MONGODB_URI. Normal startup requires a configured MongoDB connection string. Demo mode is disabled.`
- Demo seed protection:
  - Command: `node src/seed/seed.js` without `ALLOW_DEMO_SEED=true`.
  - Actual result: exit code **1** with `[Seed] Demo seeding is disabled by default. Set ALLOW_DEMO_SEED=true only for an isolated development database.`
- Credential sanitization test:
  - Verified URI credentials masking in error messages (`admin:***@cluster0.mongodb.net`).
- Documentation:
  - `FLOW.md` created at repository root (`G:\HireVoxa\FLOW.md`) documenting system architecture, lifecycle, and 12-step future Atlas guide.
- Live database persistence test:
  - Status: **BLOCKED**. No MongoDB Atlas account or cluster provisioned (postponed intentionally by operator).

## Acceptance matrix

| Requirement | Result | Evidence / limitation |
|---|---|---|
| Database configuration layer environment-driven | PASS | `MONGODB_URI` read from environment, documented in `.env.example`. |
| Credential masking in logs | PASS | `sanitizeError()` scrubs user/password credentials from logs and error output. |
| Production / missing DB startup failure | PASS | Startup immediately halts with exit code 1 if required database is missing/unreachable. |
| Fake data not automatically presented during normal startup | PASS | Normal direct startup fails without MongoDB; explicit demo mode requires opt-in. |
| Demo seeding isolated | PASS | Seed command requires valid MongoDB and explicit `ALLOW_DEMO_SEED=true`. |
| Confirmed demo records safely cleaned | BLOCKED | No configured database; no destructive cleanup executed. |
| Real records preserved | BLOCKED | No live database inventory available. |
| MongoDB persistence across restart | BLOCKED | `MONGODB_URI` and Atlas cluster intentionally postponed. |
| No silent production fallback | PASS | Verified in unit tests and direct process invocation. |
| Company tenant isolation | PASS in test adapter | All 18 tenant isolation test scenarios pass cleanly. |
| Session/auth regression | PASS in test adapter | All 25 security/session tests pass cleanly. |
| Existing recruiter API regression | PASS in test adapter | Complete 10-suite regression passes (118 tests). |
| Frontend build | PASS | Vite production bundle compiled cleanly (exit code 0). |
| Frontend lint | PASS | oxlint finished with 0 errors (exit code 0). |
| Browser real-data verification | BLOCKED | Live database and browser automation run outstanding. |

## Remaining dependencies

1. Provide a dedicated non-production MongoDB database and `MONGODB_URI`.
2. Review and run `planDemoCleanup()` against that database.
3. Export and inspect the generated backup before any cleanup confirmation.
4. Quarantine ambiguous records and remove only confirmed demo records after dependency review.
5. Run a restart persistence test against the configured database.
6. Configure private production object storage for resumes.
7. Run browser verification of recruiter and candidate journeys.

## Phase decision

**Do not advance to Phase 3 acceptance or Phase 4/4.5/5/6 implementation under this directive until the MongoDB dependency is supplied and the Phase 2B persistence/cleanup acceptance tests pass.** The existing Phase 3 implementation remains in the working tree, but its prior in-memory-only evidence does not satisfy this production-data gate.
