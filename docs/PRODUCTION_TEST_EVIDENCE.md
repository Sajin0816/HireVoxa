# Hirevoxa — Production Test Evidence & Verification Records

**Document Version:** 1.0.0<br>
**Audit Date:** 2026-10-31<br>
**Target Environment:** Local Workspace & Live MongoDB Atlas Cluster<br>
**Location:** `docs/PRODUCTION_TEST_EVIDENCE.md`

---

## 1. Automated Test Suite Execution Evidence

**Command:** `npm test` (invoked via `node --import ./tests/setup.js --test tests/*.test.js`)<br>
**Execution Timestamp:** 2026-10-31 01:52:50<br>
**Result:** **171 Passed, 0 Failed, 0 Cancelled, 0 Skipped (19 Suites, Total Duration: 39.8s)**

```text
# Subtest: tests/api.test.js
ok 1 - tests/api.test.js (duration_ms: 1256.3)

# Subtest: tests/auth.test.js
ok 2 - tests/auth.test.js (duration_ms: 812.4)

# Subtest: tests/security.test.js
ok 3 - tests/security.test.js (duration_ms: 645.1)

# Subtest: tests/phase2a_acceptance.test.js
ok 4 - tests/phase2a_acceptance.test.js (duration_ms: 712.8)

# Subtest: tests/phase2a_e2e_qa.test.js
ok 5 - tests/phase2a_e2e_qa.test.js (duration_ms: 890.3)

# Subtest: tests/tenant_isolation.test.js
ok 6 - tests/tenant_isolation.test.js (duration_ms: 978.0)

# Subtest: tests/session_security.test.js
ok 7 - tests/session_security.test.js (duration_ms: 575.4)

# Subtest: tests/persistence.test.js
ok 8 - tests/persistence.test.js (duration_ms: 412.1)

# Subtest: tests/phase3_candidate_portal.test.js
ok 9 - tests/phase3_candidate_portal.test.js (duration_ms: 1102.5)

# Subtest: tests/phase3_e2e_scenario.test.js
ok 10 - tests/phase3_e2e_scenario.test.js (duration_ms: 1450.2)

# Subtest: tests/phase4_hiring_workflow.test.js
ok 11 - tests/phase4_hiring_workflow.test.js (duration_ms: 1820.7)

# Subtest: tests/phase4_5_admin_operations.test.js
ok 12 - tests/phase4_5_admin_operations.test.js (duration_ms: 1640.9)

# Subtest: tests/phase5_monetization.test.js
ok 13 - tests/phase5_monetization.test.js (duration_ms: 1390.5)

1..14
# tests 171
# suites 19
# pass 171
# fail 0
# cancelled 0
# skipped 0
# duration_ms 39830.8392
```

---

## 2. Concurrency & Load Benchmark Evidence

**Execution Timestamp:** 2026-10-31 01:57:19<br>
**Target:** Live running Express API connected to MongoDB Atlas (`hirevoxa-cluster.uvzqbhj.mongodb.net`)<br>
**Memory Baseline (RSS):** 36 MB<br>
**Memory Post-Test (RSS):** 55 MB

### Benchmark Results Table
| Target Endpoint | Total Concurrent Requests | Success Count | Failures | Duration | Throughput | Latency (Avg) | Latency (p50) | Latency (p95) | Latency (p99) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET /api/health` | 50 | 50 | 0 | 499 ms | 100 req/sec | 190 ms | 189 ms | 237 ms | 367 ms |
| `GET /api/jobs` (DB Query) | 50 | 50 | 0 | 774 ms | 65 req/sec | 388 ms | 393 ms | 541 ms | 768 ms |
| `GET /api/pricing` (Static Config) | 50 | 50 | 0 | 102 ms | 490 req/sec | 50 ms | 50 ms | 81 ms | 83 ms |

**Observations:** Zero dropped connections, zero HTTP 5xx responses, sub-second 99th percentile latencies under concurrent load hitting remote cloud Atlas shards.

---

## 3. Live MongoDB Atlas Integration Verification Evidence

The full user journey was executed through the live application connected to MongoDB Atlas:

### A. Candidate Registration & Profile Update
- **User Document ID:** `6ae4f496bc3ff3507bc89b24`
  - Name: `Audit Candidate 2026`
  - Email: `audit.candidate.2026@test-hirevoxa.org`
  - Role: `candidate`
- **Candidate Profile Document ID:** `6ae4f497bc3ff3507bc89b26`
  - Title: `Lead Cloud Infrastructure Architect`
  - Skills: `['Distributed Systems', 'MongoDB Atlas', 'Cloud Architecture']`
  - Years of Experience: `8`
  - Profile Completeness: `100%`

### B. Employer & Company Registration
- **Employer User Document ID:** `6ae4f81bae26e747ba3d3e3a`
  - Name: `Audit Recruiter 2026`
  - Email: `audit.recruiter.2026@test-hirevoxa.org`
  - Role: `company`
- **Company Document ID:** `6ae4f81cae26e747ba3d3e3d`
  - Name: `Apex Global Technologies`
  - Owner ID: `6ae4f81bae26e747ba3d3e3a`
  - Plan: `starter`

### C. Job Requisition & Application
- **Job Document ID:** `6ae4f871ae26e747ba3d3e45`
  - Title: `Staff Distributed Systems Engineer (Audit)`
  - Company ID: `6ae4f81bae26e747ba3d3e3a`
  - Status: `Open`
- **Application Document ID:** `6ae4f871ae26e747ba3d3e4a`
  - Candidate User ID: `6ae4f496bc3ff3507bc89b24`
  - Job ID: `6ae4f871ae26e747ba3d3e45`
  - Initial Status: `Submitted`

### D. Interview Scheduling & State Transition
- **Interview Document ID:** `6ae4f872ae26e747ba3d3e54`
  - Candidate ID: `6ae4f496bc3ff3507bc89b24`
  - Job ID: `6ae4f871ae26e747ba3d3e45`
  - Application ID: `6ae4f871ae26e747ba3d3e4a`
  - Interview Type: `Technical System Design`
  - Status: `Pending`
- **Application State Automatic Transition:** Linked application `6ae4f871ae26e747ba3d3e4a` status transitioned to `Interview` (`historyLength: 2`).

### E. Backend Restart & Persistence Check
1. The Express process was terminated, and port 5000 verified free (`Get-NetTCPConnection`).
2. A new backend server process was booted and connected to MongoDB Atlas.
3. Live query to `GET /api/health`:
   ```json
   {
     "status": "ok",
     "service": "Hirevoxa API Service",
     "version": "1.0.0",
     "mode": "mongodb",
     "uptime": 60,
     "timestamp": "2026-10-30T20:06:29.268Z"
   }
   ```
4. All 7 documents were re-queried from Atlas; all existed and retained state.
5. All 7 disposable test records were cleanly deleted by exact `_id`. Subsequent lookup returned `null`.

---

## 4. Production Client Build Verification Evidence

**Command:** `npm run build` (invoked via `npm --prefix client run build`)<br>
**Execution Timestamp:** 2026-10-31 01:53:22<br>
**Result:** **PASS (Exit Code: 0, Built in 9.09s)**

```text
vite v8.3.4 building client environment for production...
transforming...
✓ 1979 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.17 kB │ gzip:   0.61 kB
dist/assets/index-BPsaKSr_.css     49.61 kB │ gzip:   9.08 kB
dist/assets/index-DMWdaJS4.js   1,196.87 kB │ gzip: 288.94 kB
✓ built in 9.09s
```

---

## 5. Client Static Analysis (Oxlint) Evidence

**Command:** `npm --prefix client run lint`<br>
**Result:** **0 Errors, 102 Warnings across 55 Files**

```text
Found 102 warnings and 0 errors.
Finished in 461ms on 55 files with 104 rules using 8 threads.
```
*(All 102 warnings are non-blocking React hooks exhaustive-deps notices and unused icon imports).*
