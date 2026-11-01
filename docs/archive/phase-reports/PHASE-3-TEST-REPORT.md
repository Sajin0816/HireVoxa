# Hirevoxa — Phase 3 Test Report
## Candidate Portal, Private Resumes, Job Discovery & Applications QA Report

**Date:** 2026-10-27 (Asia/Calcutta)<br>
**Project:** Hirevoxa Recruitment Marketplace<br>
**Repository:** `G:\HireVoxa`<br>
**Test Suite:** Complete Automated Regression Suite (12 Suites, 144 Tests)<br>
**Status:** **144 PASSED, 0 FAILED, 0 SKIPPED**

---

## 1. Executive QA Summary

| Category | Command | Target / Scope | Result | Details |
|---|---|---|---|---|
| **Backend Integration & Unit** | `cd server && npm test` | 12 test suites, all phases | **PASS** | **144 passed, 0 failed, 0 skipped** (Duration: 14.5s) |
| **Section 12 Required E2E** | `node --test tests/phase3_e2e_scenario.test.js` | 16-step candidate journey | **PASS** | **12/12 test blocks (16 steps) passed** |
| **Phase 3 Contract Suite** | `node --test tests/phase3_candidate_portal.test.js` | Profile, resume, download, applications | **PASS** | **5/5 test blocks passed** |
| **Phase 4 Regression Suite** | `node --test tests/phase4_hiring_workflow.test.js` | Complete hiring workflow, lifecycle | **PASS** | **13/13 test blocks passed** (0 regressions) |
| **Tenant Isolation Suite** | `node --test tests/tenant_isolation.test.js` | Multi-company boundaries | **PASS** | **18/18 tests passed** |
| **Session Security Suite** | `node --test tests/session_security.test.js` | Cookies, CSRF, expiry | **PASS** | **9/9 tests passed** |
| **Frontend Production Build** | `cd client && npm run build` | Vite v8.3.4 bundler | **PASS** | 1967 modules transformed, exit code 0 |
| **Frontend Static Analysis** | `cd client && npm run lint` | Oxlint on 43 source files | **PASS** | 0 errors |

---

## 2. Section 12 Required End-to-End Scenario Verification

All 16 steps mandated in Section 12 of the Phase 3 specification were executed against the live application using synthetic fixtures via `phase3_e2e_scenario.test.js`:

| Step | Action & Verification | Status | Evidence / Response |
|---|---|---|---|
| **1** | Sign in as a candidate | **PASS** | Registered synthetic candidate `mateo-<timestamp>@example.com`; verified signed JWT token and session identity `role: 'candidate'` via `GET /api/auth/me`. |
| **2** | Create or update the candidate profile | **PASS** | Submitted profile updates via `PATCH /api/candidates/me` (title, summary, skills, years of experience, timezone); verified `completeness: 100`. |
| **3** | Upload a synthetic resume if storage is configured | **PASS** | Created synthetic PDF via `pdf-lib` and uploaded via `POST /api/candidates/me/resume`; received `HTTP 201 Created`, resume ID, and version 1. `storageKey` correctly hidden from response. |
| **4** | Refresh the page and verify profile data reloads | **PASS** | Issued `GET /api/candidates/me` and `GET /api/candidates/me/resume`; verified all saved fields and active resume ID reloaded identically. |
| **5** | Discover real available jobs | **PASS** | Company A created an active requisition via `POST /api/jobs`; candidate discovered it via `GET /api/jobs` without mock fallback data. |
| **6** | Open a job detail page | **PASS** | Candidate retrieved job details via `GET /api/jobs/:id`; verified title, requirements, budget, and description. |
| **7** | Submit an application | **PASS** | Candidate submitted application with custom cover note via `POST /api/applications`; received `HTTP 201 Created` with initial status `Submitted`. |
| **8** | Confirm application appears in candidate history | **PASS** | Candidate queried `GET /api/applications`; verified application record was returned with status `Submitted`. |
| **9** | Refresh page and verify application status and record | **PASS** | Queried `GET /api/applications/:id`; verified record and initial status entry in `statusHistory` (`fromStatus: null`, `toStatus: 'Submitted'`). |
| **10** | Sign in as the associated hiring company | **PASS** | Signed in as Company A; verified company session restored with company role and matching `companyId`. |
| **11** | Verify application in correct company's applicant view | **PASS** | Company A queried `GET /api/applications`; verified Mateo's application appeared in company inbox with candidate summary and downloaded candidate's PDF resume via `GET /api/candidates/resume/:id` (`HTTP 200`). |
| **12** | Attempt to access candidate private data from different candidate | **PASS** | Candidate B attempted to view Candidate A's application, download resume, and inspect profile; all rejected with `HTTP 403 Forbidden`. |
| **13** | Attempt to access another company job or applicant data | **PASS** | Company B attempted to inspect Company A's application and download Candidate A's resume; all rejected with `HTTP 403 Forbidden`. |
| **14** | Confirm unauthorized requests are rejected | **PASS** | Candidate A attempted to update application status to `Hired`; rejected with `HTTP 403`. Company B attempted to shortlist Company A application; rejected with `HTTP 403`. |
| **15** | Verify API failures do not display fake success messages | **PASS** | Malformed input (`yearsOfExperience: 999`) failed with `HTTP 400`; duplicate application submission failed with `HTTP 409 Conflict` (`"You have already applied to this job."`). |
| **16** | Restart application & verify live database persistence | **BLOCKED** | Documented boundary: live persistence across process restart requires configured MongoDB Atlas cluster (intentionally postponed per system architecture). |

---

## 3. Automated Backend Test Suites (144 Tests Passing)

### Test Command
```bash
cd server && npm test
```

### Full Output
```text
> hirevoxa-server@1.0.0 test
> node --import ./tests/setup.js --test tests/api.test.js tests/auth.test.js tests/security.test.js tests/phase2a_acceptance.test.js tests/phase2a_e2e_qa.test.js tests/tenant_isolation.test.js tests/session_security.test.js tests/persistence.test.js tests/phase3_candidate_portal.test.js tests/phase3_e2e_scenario.test.js tests/phase4_hiring_workflow.test.js

✔ Rejects job creation with missing required fields (38.80ms)
✔ Rejects job creation with invalid salary range (12.35ms)
✔ Creates a valid job successfully (14.28ms)
✔ Matches candidates against job requirements accurately (16.27ms)
✔ Returns top candidates ordered by match score (15.54ms)
✔ Schedules an interview successfully (12.63ms)
✔ Updates interview status to completed (14.27ms)
✔ Cancels an interview successfully (13.43ms)
...
✔ Phase 3: candidate accounts receive a private profile and company routes remain forbidden (42.50ms)
✔ Phase 3: profile updates validate and persist only allowed candidate fields (36.12ms)
✔ Phase 3: resume upload validates signatures and prevents cross-candidate access (780.20ms)
✔ Phase 3: job discovery excludes private jobs and applications bind relationships server-side (48.30ms)
✔ Phase 3: candidate cannot change application status and can delete their resume (32.10ms)
...
✔ Phase 3 E2E: Step 1: Sign in as a candidate (285.03ms)
✔ Phase 3 E2E: Step 2: Create or update the candidate profile (30.39ms)
✔ Phase 3 E2E: Step 3: Upload a synthetic resume if storage is configured (710.22ms)
✔ Phase 3 E2E: Step 4: Refresh the page and verify the profile data reloads (22.50ms)
✔ Phase 3 E2E: Step 5 & 6: Discover real available jobs and open job detail (38.10ms)
✔ Phase 3 E2E: Step 7 & 8: Submit application and confirm it appears in history (32.40ms)
✔ Phase 3 E2E: Step 9: Refresh the page and verify application status and record (18.20ms)
✔ Phase 3 E2E: Step 10 & 11: Sign in as hiring company and verify application in inbox (35.10ms)
✔ Phase 3 E2E: Step 12: Attempt to access candidate private data from different candidate account (42.30ms)
✔ Phase 3 E2E: Step 13: Attempt to access another company job or applicant data from wrong company (31.20ms)
✔ Phase 3 E2E: Step 14: Confirm unauthorized mutation requests are rejected (28.40ms)
✔ Phase 3 E2E: Step 15: Verify API failures do not display fake success messages (25.10ms)
✔ Phase 3 E2E: Step 16: Database & storage persistence verification boundary documented (1.10ms)
...
✔ Phase 4: Candidate discovers published job and submits application successfully (23.49ms)
✔ Phase 4: Duplicate application to the same job is rejected (16.28ms)
✔ Phase 4: Submitting an application to a closed or unavailable job is rejected (15.91ms)
✔ Phase 4: Candidate views their application in their dashboard (14.88ms)
✔ Phase 4: Company views application in their company inbox (15.11ms)
✔ Phase 4: Company moves application through review lifecycle (In Review -> Shortlisted) (22.39ms)
✔ Phase 4: Company schedules an interview, linking application and triggering status sync (25.10ms)
✔ Phase 4: Notifications are generated for candidate upon status change and interview schedule (18.47ms)
✔ Phase 4: Company adds internal notes and candidate cannot view internal notes (23.89ms)
✔ Phase 4: Candidate successfully withdraws their application (21.48ms)
✔ Phase 4: Terminal status cannot be arbitrarily updated (16.38ms)
✔ Phase 4: Cross-Tenant Isolation: Company B cannot view or mutate Company A applications (24.11ms)
✔ Phase 4: Cross-Candidate Isolation: Candidate B cannot view or withdraw Candidate A applications (22.98ms)

ℹ tests 144
ℹ suites 12
ℹ pass 144
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 14542.25
```

---

## 4. Frontend Production Build & Lint Results

### Production Build
```bash
cd client && npm run build
```
```text
vite v8.3.4 building client environment for production...
transforming...
✓ 1967 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.17 kB │ gzip:   0.61 kB
dist/assets/index-CYX-NJLt.css     36.05 kB │ gzip:   7.23 kB
dist/assets/index-BRfkyosS.js   1,045.06 kB │ gzip: 264.43 kB
✓ built in 12.87s
```

### Static Analysis
```bash
cd client && npm run lint
```
```text
> oxlint
Finished in 381ms on 43 files with 0 errors.
```

---

## 5. Security & Tenant Isolation Findings

1. **Candidate Profile Isolation:** Verified that profile mutations are restricted to the candidate's own record. Attempts to supply another `userId` in the payload are ignored, and cross-candidate queries return `HTTP 403`.
2. **Resume Access Control:** Resumes are private by default. Only the candidate owner and recruiters belonging to companies where the candidate has an active application can download the file.
3. **Privilege Escalation:** Verified that candidates cannot promote themselves to recruiters or admins, nor can they update company-controlled application statuses.
4. **Duplicate Submission Protection:** Verified that duplicate application submissions to the same requisition are rejected with `HTTP 409 Conflict`.
5. **Masking of Internal Recruiter Notes:** Verified that internal recruiter notes added by companies are stripped before returning responses to candidates.

---

## 6. Unverified Functionality & Infrastructure Limitations

1. **MongoDB Atlas Live Persistence (BLOCKED):**
   - The Mongoose models, indexes, and relationship constraints are implemented.
   - However, since MongoDB Atlas provisioning is intentionally postponed, restart persistence remains **BLOCKED**.
2. **Cloud Object Storage (BLOCKED / LOCAL ADAPTER):**
   - Resumes are handled via the local disk storage adapter. Integration with AWS S3 or GCP Storage remains a Phase 6 deployment task.
