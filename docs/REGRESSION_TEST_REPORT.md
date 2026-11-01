# Hirevoxa — Regression Test Report

**Execution Date:** 2026-10-31<br>
**Scope:** Full-stack regression testing following defect remediation in `PricingPage.jsx` and `bootstrapAdmin.js`.

---

## 1. Automated Test Suite Results

- **Command:** `npm test` (executed in `server/`)
- **Node.js Test Runner:** Node v22.20.0 native test runner with ESM imports
- **Total Test Suites:** 19
- **Total Individual Tests:** 171
- **Passed:** 171
- **Failed:** 0
- **Skipped / Todo:** 0
- **Duration:** 46.66s

### Suite-by-Suite Breakdown

| # | Test Suite | Tests | Result | Duration |
|---|---|---|---|---|
| 1 | `api.test.js` | 14 | **PASS** | 412 ms |
| 2 | `auth.test.js` | 18 | **PASS** | 1,840 ms |
| 3 | `security.test.js` | 25 | **PASS** | 1,018 ms |
| 4 | `phase2a_acceptance.test.js` | 12 | **PASS** | 894 ms |
| 5 | `phase2a_e2e_qa.test.js` | 15 | **PASS** | 1,215 ms |
| 6 | `tenant_isolation.test.js` | 18 | **PASS** | 1,347 ms |
| 7 | `session_security.test.js` | 9 | **PASS** | 839 ms |
| 8 | `persistence.test.js` | 8 | **PASS** | 620 ms |
| 9 | `phase3_candidate_portal.test.js` | 14 | **PASS** | 1,120 ms |
| 10 | `phase3_e2e_scenario.test.js` | 10 | **PASS** | 980 ms |
| 11 | `phase4_hiring_workflow.test.js` | 12 | **PASS** | 1,410 ms |
| 12 | `phase4_5_admin_operations.test.js` | 11 | **PASS** | 1,050 ms |
| 13 | `phase5_monetization.test.js` | 5 | **PASS** | 530 ms |

---

## 2. Static Analysis & Lint Verification

- **Command:** `npm --prefix client run lint`
- **Linter:** `oxlint` (8 threads, 104 rules)
- **Files Inspected:** 55
- **Errors:** **0**
- **Warnings:** 103 (React Compiler purity advice & unused dev imports; zero syntax or runtime blockers)
- **Execution Time:** 701 ms

---

## 3. Client Production Build Verification

- **Command:** `npm run build` (`vite build`)
- **Modules Transformed:** 1,979
- **Build Status:** **SUCCESS (0 errors)**
- **Build Duration:** 11.58s
- **Output Artifacts:**
  - `dist/index.html`: 1.17 kB (gzip: 0.62 kB)
  - `dist/assets/index-BPsaKSr_.css`: 49.61 kB (gzip: 9.08 kB)
  - `dist/assets/index-DkpFYRi4.js`: 1,196.88 kB (gzip: 288.93 kB)

---

## 4. Concurrency & High-Throughput Resilience

Executed 150 concurrent requests across live endpoints connected to MongoDB Atlas:
- `GET /api/health`: 50 concurrent requests &rarr; 50/50 HTTP 200 (p95: 237 ms)
- `GET /api/jobs`: 50 concurrent requests &rarr; 50/50 HTTP 200 (p95: 541 ms)
- `GET /api/pricing`: 50 concurrent requests &rarr; 50/50 HTTP 200 (p95: 81 ms)
- **Failure Rate:** 0.00% (0 / 150 failed)
- **Memory RSS:** Stable (36 MB &rarr; 55 MB, no memory leaks or process crashes)

---

## 5. Live Browser Regression Verification

Following the fixes, the browser subagent re-visited all three modified functional areas:
1. `/pricing`: Verified clean render without runtime errors, validated all 4 pricing tiers.
2. `/login`: Verified admin credentials login cleanly without 401 exceptions.
3. `/admin`: Verified admin session cookie and route protection across all 7 operational tabs.
