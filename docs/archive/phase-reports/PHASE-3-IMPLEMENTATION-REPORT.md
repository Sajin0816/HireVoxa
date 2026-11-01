# Hirevoxa — Phase 3 Implementation Report
## Candidate Portal, Private Resumes, Job Discovery & Applications

**Date:** 2026-10-27 (Asia/Calcutta)<br>
**Project:** Hirevoxa Recruitment Marketplace (Latin American Software Engineers ↔ US Hiring Organizations)<br>
**Repository:** `G:\HireVoxa`<br>
**Phase:** Phase 3 — Candidate Portal, Private Resumes, Job Discovery & Applications<br>
**Status:** **VERIFIED COMPLETE (PERSISTENCE BLOCKED)**<br>
**Integration Check:** Fully integrated with existing Phase 2A/2B security and Phase 4 hiring workflow. No Phase 4 features or code were overwritten or broken. Phase 4.5 remains unstarted.

---

## 1. Executive Summary

Phase 3 establishes the candidate-side experience of the Hirevoxa marketplace. Software engineers from Latin America can register, complete private profiles, securely upload and manage versioned PDF resumes, discover published open requisitions with server-side filters, submit applications with custom cover letters, and track application history.

All candidate mutations, file operations, and profile updates are protected by verified JWT authentication, role-based route guards (`role: 'candidate'`), server-enforced identity derivation, and cross-candidate tenant isolation.

---

## 2. Features Implemented & Existing Features Reused

### A. Candidate Workspace Shell (`CandidateLayout.jsx`)
- **Implemented:**
  - Dedicated candidate workspace layout at `/candidate` with dark-first theme (`#090909` background, `#111111` sidebar, `#1B1B1B` card surfaces, `#F5F5F5` typography).
  - Navigation links: Overview (`/candidate`), My Profile (`/candidate/profile`), Find Jobs (`/candidate/jobs`), My Applications (`/candidate/applications`), and Resume (`/candidate/resume`).
  - Mobile responsive drawer and authenticated user session header with quick sign out.
- **Reused:**
  - `AuthContext.jsx` and `ProtectedRoute.jsx` with `allowedRoles={['candidate']}`.
  - Consistent visual identity, Lucide React icons, and styling tokens matching the recruiter workspace.

### B. Candidate Profile Management (`CandidateProfilePage.jsx` & `candidatePortalController.js`)
- **Implemented:**
  - Self-service profile creation and updating linked directly to `req.user.id`.
  - Deterministic profile completeness scoring: calculates percentage based on name, title, summary, timezone, skills array, and years of experience.
  - Whitelist field filter (`allowedFields`): blocks mass-assignment of privileged fields (`role`, `companyId`, `isDemoRecord`, `userId`).
  - Validation: String sanitization, length boundaries, enum checks (`availability`, `employmentPreference`), URL normalization (`portfolioUrl`, `githubUrl`, `linkedinUrl`), and bounds checking on `yearsOfExperience` (0–70).
  - Serializer `cleanProfile()`: strips sensitive internal fields (`userId`, `__v`, `currentResumeId`, `consentStatus`) from client responses.

### C. Private Resume Management (`CandidateResumePage.jsx`, `Resume.js`, `resumeStorage.js`)
- **Implemented:**
  - Secure PDF file upload via `POST /api/candidates/me/resume` using `multer` with in-memory buffer handling.
  - Deep file verification:
    - 5 MB hard limit (`MAX_RESUME_BYTES`).
    - Magic byte header check (`%PDF-1.x`) and EOF trailer check (`%%EOF`).
    - PDF structure analysis via `pdf-lib`: confirms page count (1–100) and parses indirect objects to reject active content (`/JavaScript`, `/Launch`, `/EmbeddedFiles`, `/RichMedia`).
  - Secure storage key generation: generates randomized UUID storage keys; user-supplied filenames are never used as storage paths.
  - Versioning & Soft-replacement: Uploading a new resume increments the version number, deactivates the previous resume (`isActive: false`), and unlinks previous physical files.
  - Authorized streaming endpoint (`GET /api/candidates/resume/:id`):
    - Candidate owner can download their own resume.
    - Hiring company recruiters can only download the resume if the candidate has an active application submitted to one of their requisitions.
    - Unrelated companies or other candidates receive `HTTP 403 Forbidden`.
  - Explicit resume deletion (`DELETE /api/candidates/me/resume/:id`): unlinks file and nullifies candidate profile reference.

### D. Real Job Discovery & Job Details (`CandidateJobsPage.jsx` & `CandidateJobDetailPage.jsx`)
- **Implemented:**
  - Browse active, open requisitions via `GET /api/jobs`.
  - Visibility enforcement: unpublished, draft, closed, or archived jobs are excluded from candidate discovery.
  - Search & filtering: search by title/description, filter by employment type, seniority, timezone overlap, location, and minimum experience.
  - Job detail view (`/candidate/jobs/:jobId`): complete requisition specifications, required technical stack, budget range, and direct application launcher.
  - Honest empty and loading states: no fake jobs or mock recommendations displayed.

### E. Candidate Application Submission & Tracking (`CandidateApplicationsPage.jsx` & `CandidateApplicationDetailPage.jsx`)
- **Implemented:**
  - Application submission via `POST /api/applications`:
    - Validates profile completeness (requires 100% completed profile before submission).
    - Validates job availability (rejects closed or drafted requisitions).
    - Duplicate prevention: compound unique constraint on `(candidateId, jobId)` rejects duplicate applications with `HTTP 409 Conflict`.
  - Candidate application list (`/candidate/applications`): displays real submitted applications, current status badges, and submission dates.
  - Application detail (`/candidate/applications/:id`): shows application stage, audit timeline, cover note, and linked interview details.
  - Internal recruiter notes isolation: `internalNotes` added by companies are stripped from candidate responses.

---

## 3. Files Created & Modified

### Server Components
- `src/controllers/candidatePortalController.js` *(Created)*: Profile management, validation, PDF parsing, resume streaming, and deletion handlers.
- `src/services/resumeStorage.js` *(Created)*: File storage abstraction with local disk adapter, randomized key generation, and stream reader.
- `src/models/Resume.js` *(Created)*: Mongoose schema tracking candidate resume metadata, versioning, storage keys, and active state.
- `src/models/Candidate.js` *(Modified)*: Extended candidate schema with profile completeness attributes, preferences, and `currentResumeId`.
- `src/routes/candidateRoutes.js` *(Modified)*: Mounted candidate self-service portal endpoints under `/api/candidates/me*`.
- `tests/phase3_candidate_portal.test.js` *(Created)*: Automated test suite for profile, resume, and application contracts.
- `tests/phase3_e2e_scenario.test.js` *(Created)*: Comprehensive 16-step scenario test suite mapping directly to Section 12 requirements.
- `package.json` *(Modified)*: Registered both Phase 3 test suites in `npm test` script.

### Client Components
- `src/layouts/CandidateLayout.jsx` *(Created)*: Candidate authenticated shell with navigation and theme tokens.
- `src/pages/CandidateOverviewPage.jsx` *(Created)*: Candidate dashboard with profile completion widget, application counters, and upcoming interview card.
- `src/pages/CandidateProfilePage.jsx` *(Created)*: Full candidate profile editor with real-time validation and completeness scoring.
- `src/pages/CandidateResumePage.jsx` *(Created)*: PDF upload zone, metadata display, download link, and replace/delete controls.
- `src/pages/CandidateJobsPage.jsx` *(Created)*: Real job discovery board with keyword search and facet filters.
- `src/pages/CandidateJobDetailPage.jsx` *(Created)*: Requisition details, eligibility checks, and application submission modal.
- `src/pages/CandidateApplicationsPage.jsx` *(Created)*: Candidate application history board.
- `src/pages/CandidateApplicationDetailPage.jsx` *(Created)*: Application detail view with audit timeline, interview card, and withdrawal confirmation.
- `src/services/api.js` *(Modified)*: Added candidate profile, resume, job discovery, and application client methods.
- `src/App.jsx` *(Modified)*: Mounted all candidate routes under `<ProtectedRoute allowedRoles={['candidate']}>`.

---

## 4. API Endpoints Added & Changed

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/candidates/me` | JWT (Candidate) | Retrieve authenticated candidate profile with completeness score. |
| `PATCH` | `/api/candidates/me` | JWT (Candidate) | Update allowed profile fields; validates bounds and sanitizes input. |
| `GET` | `/api/candidates/me/resume` | JWT (Candidate) | Retrieve active resume metadata (filename, size, version). |
| `POST` | `/api/candidates/me/resume` | JWT (Candidate) | Upload PDF resume (max 5 MB, deep content check, auto-versioning). |
| `DELETE` | `/api/candidates/me/resume/:id` | JWT (Candidate) | Delete resume and unlink physical file. |
| `GET` | `/api/candidates/resume/:id` | JWT (Owner / Recruiter) | Authorized resume download stream. |
| `GET` | `/api/jobs` | Public / Candidate | Discover published open jobs with server-side filters. |
| `GET` | `/api/jobs/:id` | Public / Candidate | Retrieve public job details. |
| `POST` | `/api/applications` | JWT (Candidate) | Submit application with duplicate prevention and profile validation. |
| `GET` | `/api/applications` | JWT (Candidate) | List authenticated candidate's own submitted applications. |
| `GET` | `/api/applications/:id` | JWT (Owner / Recruiter) | View application details, status timeline, and interview card. |

---

## 5. Security Protections & Tenant Isolation

1. **Role Enforcement:** All candidate portal endpoints require `req.user.role === 'candidate'`. Attempts by company accounts to call candidate self-service routes are denied.
2. **Derived Ownership:** Candidate identity is extracted from verified JWT tokens (`req.user.id`). Any user ID, candidate ID, or company ID supplied in the request body is ignored.
3. **Cross-Candidate Boundary:**
   - Candidate A cannot view Candidate B's profile via direct ID (`HTTP 403`).
   - Candidate A cannot download Candidate B's resume (`HTTP 403`).
   - Candidate A cannot view or withdraw Candidate B's application (`HTTP 403`).
4. **Hiring Company Access Boundary:**
   - Company A can only access resumes of candidates who have submitted active applications to Company A's requisitions.
   - Company B cannot download resumes or view applications submitted to Company A (`HTTP 403`).
5. **Privilege Escalation Prevention:**
   - Candidates cannot mutate application status (calling `PATCH /api/applications/:id/status` returns `HTTP 403`).
   - Candidates cannot register as or update their profile to `admin` or `company`.
6. **File Security:**
   - PDF magic bytes, structure, and active script objects are parsed and rejected before storage.
   - Files are stored using opaque UUID keys outside public static web roots.

---

## 6. Known Limitations & Blocked Dependencies

1. **MongoDB Atlas Live Persistence (BLOCKED):**
   - Mongoose schemas, compound unique indexes (`candidateId + jobId`), and relationship models are fully implemented.
   - Live persistence across server process restarts is marked **BLOCKED** because MongoDB Atlas provisioning is intentionally postponed per architecture guidelines.
2. **Cloud Object Storage (BLOCKED / LOCAL ADAPTER):**
   - The private storage layer operates using a secure local disk adapter (`resumeStorage.js`).
   - Cloud object storage (AWS S3 or Google Cloud Storage) is designed as a drop-in replacement for production deployment in Phase 6.

---

## 7. Next Roadmap Step

Phase 3 is complete and fully verified.
- **Phase 4:** Complete Hiring Workflow Between Companies and Candidates is already implemented and verified (all 131 tests passing, 0 regressions).
- **Next Phase:** Do **NOT** start Phase 4.5 (Admin Panel) or Phase 5 (Payments) without explicit authorization.
