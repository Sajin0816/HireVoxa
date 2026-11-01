# HIREVOXA SYSTEM ARCHITECTURE & LIFECYCLE FLOW (FLOW.md)

**Project Root:** `G:\HireVoxa`<br>
**Application:** Hirevoxa Recruitment Marketplace (US Hiring Organizations ↔ Latin American Software Engineers)<br>
**Current Milestone:** Phase 4.5 — Secure Operations Admin Panel & Live MongoDB Atlas Persistence (Audited & Verified)<br>
**Database Status:** Connected to MongoDB Atlas cluster (`hirevoxa` database). Live persistence across server restart: **VERIFIED COMPLETE**.<br>
**Source of Truth:** Verified repository code, live database ping & restart persistence verification, actual test executions (156/156 pass across 13 suites), browser subagent recording, and master audit reports.

---

## 1. Project Overview

### What Hirevoxa Does
Hirevoxa is a two-sided recruitment marketplace designed to streamline discovering, vetting, matching, interviewing, and hiring Latin American software engineering talent for US-based technology companies. The platform provides:
- **For Hiring Organizations (Companies/Recruiters):** Requisition management, automated deterministic candidate matching based on technical stack overlap and time zone alignment, candidate shortlisting, real-time messaging, interview scheduling, and pipeline analytics.
- **For Software Engineering Talent (Candidates):** Verified profile management, technical skills indexing, salary range preferences, work arrangement and time zone availability, and job application management.

### Architectural Discovered State
Hirevoxa is constructed as a decoupled full-stack JavaScript/Node.js web application:
- **Client (`client/`):** A modern Single Page Application (SPA) built using React 19, Vite 8, TailwindCSS 3, Lucide React icons, and Three.js 3D canvas visualizations. The client routes are governed by React Router DOM v7 with stateful `AuthContext` and role-based `ProtectedRoute` route guards.
- **Server (`server/`):** A RESTful API built on Express 4.21, utilizing Helmet security headers, cookie-parser for HttpOnly session authentication, CORS origin whitelisting, Express Rate Limit, express-validator, JWT (`jsonwebtoken`), and Mongoose 8.10 ODM. The server operates in dual-mode storage: an explicit in-memory adapter (`inMemoryStore.js`) for tests and non-production demonstrations, and a full Mongoose schema layer designed for MongoDB Atlas.

### Directory Structure & Responsibilities

```
HireVoxa/
├── .env.example              # Reference environment template with safe non-credential placeholders
├── .gitignore                # Protects secrets (.env*), build outputs (dist/), and uploads
├── README.md                 # Primary platform overview and quick start guide
├── package.json              # Workspace root scripts (client/server dev, test, and build)
├── docs/                     # Authoritative platform documentation
│   ├── ARCHITECTURE.md       # Monorepo architecture, matching engine, and security
│   ├── DATABASE.md           # Schema reference, indexing, and connection lifecycle
│   ├── DEPLOYMENT.md         # Production setup, Atlas networking, and admin bootstrap
│   ├── FLOW.md               # Core system architecture, lifecycle, and operational guide
│   ├── MONETIZATION.md       # Pricing tiers, placement billing, and entitlements
│   ├── TESTING.md            # Automated test runner and quality assurance guidelines
│   ├── ADMIN-OPERATIONS-RUNBOOK.md # Operational guide for platform admin workspace
│   ├── PROJECT_STATE_AND_PHASE_TRACKER.md # Phase-by-phase status tracker and dependency gates
│   └── archive/              # Categorized historical audits, phase reports, and QA matrices
├── client/                   # Frontend SPA
│   ├── src/
│   │   ├── components/       # UI elements (Cards, Buttons, Badges, Modals, Tables)
│   │   ├── context/          # AuthContext.jsx (session restore, login, logout, roles)
│   │   ├── layouts/          # DashboardLayout.jsx, CandidateLayout.jsx, AdminLayout.jsx, Sidebar.jsx
│   │   ├── pages/            # Recruiter, Candidate & Admin page views
│   │   └── services/         # api.js (Axios-like fetch client with credentials & CSRF)
│   ├── vite.config.js        # Vite build & bundler configuration
│   └── package.json          # Frontend dependencies and scripts
└── server/                   # Backend API
    ├── src/
    │   ├── config/           # db.js (connection lifecycle, sanitization), pricing.js
    │   ├── controllers/      # Route controllers (auth, jobs, candidates, interviews, matches, etc.)
    │   ├── middleware/       # authMiddleware, adminAuthMiddleware, entitlementMiddleware, errorHandler
    │   ├── models/           # Mongoose schemas (User, Company, Candidate, Job, Interview, etc.)
    │   ├── routes/           # Express router endpoints
    │   ├── seed/             # seed.js & seedData.js (isolated demo fixtures, opt-in seeding)
    │   ├── services/         # inMemoryStore, matchingService, migrationService, dataCleanupService
    │   └── server.js         # Express app configuration, middleware pipeline, and server boot
    ├── tests/                # Automated Node test runner suites (19 suites, 171 passing tests)
    └── package.json          # Backend dependencies, test runner scripts, and entry point
```

---

## 2. System Architecture

The following diagram illustrates the complete, implemented request and data lifecycle in Hirevoxa:

```mermaid
flowchart TD
    User([Browser / Client Agent]) -->|HTTPS / HTTP| Frontend[React 19 SPA - Vite Client]
    Frontend -->|API Requests with Cookie & CSRF Header| APIClient[Client API Service - client/src/services/api.js]

    APIClient -->|HTTP REST Requests| MiddlewarePipeline[Express Server Pipeline - server.js]

    subgraph Express_Backend [Server Middleware & Security Pipeline]
        MiddlewarePipeline --> Helmet[Helmet Security Headers]
        Helmet --> CORS[CORS Origin Guard]
        CORS --> RateLimiter[Rate Limiter - 300 req / 15 min]
        RateLimiter --> CookieParser[Cookie Parser]
        CookieParser --> BodyParser[JSON Body Parser - 1MB Limit]
        BodyParser --> Router[Express Resource Routers]

        Router --> AuthMiddleware{Auth & RBAC Middleware}
        AuthMiddleware -->|Verify JWT Cookie or Bearer| RoleCheck{Role & Tenant Validation}
        RoleCheck -->|Unauthorized / Stale / Role Mismatch| ErrorResponse[401 / 403 JSON Error]
        RoleCheck -->|Authorized Tenant Identity| Controller[Route Controller Logic]
    end

    subgraph Data_Storage_Abstraction [Storage & Persistence Layer]
        Controller --> CheckMode{DB Operating Mode}
        CheckMode -->|in-memory-demo| MemoryStore[In-Memory Store - Isolated Test/Demo Adapter]
        CheckMode -->|mongodb| MongooseLayer[Mongoose ODM Models & Schemas]
        CheckMode -->|unavailable| FailFast[500 Service Unavailable]
    end

    subgraph Database_Cluster [Database Infrastructure]
        MongooseLayer -->|Connection Pool via MONGODB_URI| MongoCluster[(Configured MongoDB / Atlas Cluster)]
    end

    Controller -->|Standardized JSON Payload| ClientResponse[Client HTTP Response]
    ClientResponse --> Frontend
```

---

## 3. Authentication & Authorization Flow

### Session Establishment & Authentication
1. **Registration / Login:**
   - Client sends credentials (`POST /api/auth/register` or `POST /api/auth/login`).
   - Server validates credentials, hashes passwords using `bcryptjs` (salt rounds = 10), and generates a signed JWT containing:
     - `id`: Unique user identifier.
     - `role`: Strictly validated role (`company`, `candidate`, or `admin`).
     - `companyId`: For company accounts, established from verified organization entity.
   - Server issues an `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie (`hirevoxa_token`) and returns user profile data in the response body.
   - A non-sensitive anti-CSRF token (`hirevoxa_csrf`) is provided for state-mutating requests.

2. **Session Verification & Restoration:**
   - On page reload, `AuthContext.jsx` issues a request to `GET /api/auth/me`.
   - `authMiddleware.js` verifies the incoming `hirevoxa_token` cookie (or fallback `Authorization: Bearer <token>`).
   - If valid, the current user identity and active tenant boundary are restored.
   - If invalid, expired, or malformed, the cookie is cleared and the client state resets cleanly to unauthenticated.

3. **Role-Based Access Control (RBAC):**
   - **Company Routes:** Gated by `requireRole(['company', 'admin'])`. Candidates attempting to access company workspaces receive an HTTP 403 Forbidden.
   - **Candidate Routes:** Gated by `requireRole(['candidate', 'admin'])`.
   - **Public Endpoints:** Read-only job boards (`GET /api/jobs?public=true`), candidate discoverability queries, and health endpoints do not require authentication.

4. **Tenant Ownership Validation:**
   - All tenant-owned records (Jobs, Interviews, Shortlists, Private Messages) strictly validate `companyId`.
   - Client-supplied `companyId`, `postedBy`, or `senderId` in the request body are **stripped and discarded**. The backend enforces ownership derived directly from the authenticated token.

---

## 4. Database Connection Flow

### Configuration & Environment Driven Setup
Database connectivity is entirely environment-driven. The backend expects:

```env
MONGODB_URI=<set-this-in-your-local-backend-environment>
```

### Connection Initialization Lifecycle
1. **Startup Execution:** During application boot (`server/src/server.js`), `connectDB()` is executed before Express listens on the designated `PORT`.
2. **Missing Configuration Gate:**
   - If `MONGODB_URI` is missing or empty:
     - In `production` or when `REQUIRE_DB=true`: Throws a fatal error: `[Hirevoxa DB Config Error] Missing MONGODB_URI. Normal startup requires a configured MongoDB connection string. Demo mode is disabled.` Direct server startup immediately halts with exit code 1.
     - In non-production with `ALLOW_IN_MEMORY_DEMO=true` or in the test suite (`NODE_ENV=test`): The system activates `in-memory-demo` mode with an explicit log notification.
3. **Connection Failure & Sanitized Logging:**
   - If `mongoose.connect()` fails (e.g., DNS error, authentication failure, network timeout):
     - The connection error is scrubbed by `sanitizeError()` to mask any embedded credentials: `mongodb+srv://user:***@cluster.mongodb.net`.
     - In production / `REQUIRE_DB=true`: Startup immediately aborts with exit code 1.
     - In non-production with demo permission: Emits a warning and switches to volatile in-memory demonstration.
4. **Duplicate Connection Prevention:**
   - `connectDB()` checks `mongoose.connection.readyState`. If `1` (connected) or `2` (connecting), the call returns the existing connection object without creating duplicate sockets or unhandled rejections.
5. **Clean Shutdown:**
   - Handlers for `SIGINT` and `SIGTERM` invoke `disconnectDB()`, awaiting clean socket disconnection before exiting.

---

## 5. Demo and Test Data Flow

Hirevoxa strictly enforces separation between production data, demonstration sessions, and automated tests.

### Demo Mode Rules & Audit Results
- **Normal Startup:** Direct execution of the application **never** seeds or inserts demo records into the database.
- **Explicit Demonstration Opt-In:**
  - Running in demonstration mode requires explicitly setting `ALLOW_IN_MEMORY_DEMO=true` in local development.
  - Demonstration mode is strictly prohibited in production (`NODE_ENV=production`) regardless of environment flags.
- **Demo Seeding Command:**
  - The database seed script (`server/src/seed/seed.js`) requires:
    1. A valid, configured `MONGODB_URI`.
    2. An explicit opt-in environment flag: `ALLOW_DEMO_SEED=true`.
  - Running `npm run seed` without these flags halts immediately with exit code 1.
- **Fixture Isolation:**
  - All fixtures in `server/src/seed/seedData.js` have durable metadata: `isDemoRecord: true`.
  - Seed execution never overwrites or drops non-demo records.
- **Quarantine & Safe Cleanup:**
  - Ambiguous legacy records without verifiable tenant ownership are quarantined into `QuarantineRecord` rather than guessed or assigned to arbitrary companies.
  - Destructive cleanup is gated behind `dataCleanupService.js`, which requires a verified backup directory and explicit `confirm=true`.

---

## 6. Tenant Isolation

Tenant isolation is implemented and enforced across all business entities:

| Entity | Tenant Boundary | Enforcement Mechanism | Failure Response |
|---|---|---|---|
| **Jobs** | `companyId` | `Job.find({ companyId })` for workspace; ID mutation validates `job.companyId === req.user.companyId` | `403 Forbidden` / `404 Not Found` |
| **Interviews** | `companyId` | Scoped to scheduling organization; unauthorized access rejected | `403 Forbidden` / `404 Not Found` |
| **Shortlists** | `companyId` + `userId` | Shortlisted candidates belong strictly to the authenticated organization | Empty list / `403 Forbidden` |
| **Messages** | `companyId` / conversation | Cross-organization conversation access is blocked | `403 Forbidden` |
| **Reports** | `companyId` | Metric aggregations filter strictly by `companyId` | Company metrics isolated |
| **Candidate Resumes** | `candidateId` / authorized | Candidate private documents are accessible only to the candidate and authorized interviewing companies | `403 Forbidden` |

---

## 7. Phase Roadmap and Dependency Gates

| Phase | Description | Status | Verification & Evidence |
|---|---|---|---|
| **Phase 0** | Initial Setup & Baseline Architecture | **VERIFIED COMPLETE** | Monorepo structure, dependencies, and environment baselines verified. |
| **Phase 1** | Core Foundation & Recruiter Experience | **VERIFIED COMPLETE** | Recruiter workspace, deterministic matching, job management, client build passing. |
| **Phase 2A** | Authentication & Route Protection | **VERIFIED COMPLETE** | JWT issuance, HttpOnly cookies, candidate/company role gating, 30+ QA test scenarios passing. |
| **Phase 2B** | Tenant Isolation, Persistence Readiness & Session Security | **IMPLEMENTED (PERSISTENCE BLOCKED)** | 118 automated tests passing, startup gates enforced, credential sanitization active. Live Atlas persistence is **BLOCKED** pending database provisioning. |
| **Phase 3** | Candidate Portal & Private Resume Handling | **VERIFIED COMPLETE (PERSISTENCE BLOCKED)** | Candidate workspace, profile completeness, deep PDF resume parsing, private streaming, job discovery, and Section 12 E2E journey verified (17 tests passing). Live Atlas persistence is **BLOCKED**. |
| **Phase 4** | Complete Hiring Workflow Between Companies and Candidates | **VERIFIED COMPLETE (PERSISTENCE BLOCKED)** | End-to-end recruitment lifecycle: application submission, company inbox, lifecycle state machine, interview linkage, in-app notifications, and candidate withdrawal. 144 tests passing across 12 suites. Live Atlas persistence is **BLOCKED**. |
| **Phase 4.5** | Admin Panel & Operations Workspace | **NOT STARTED** | Gated on Phase 4 acceptance. |
| **Phase 5** | Payments & Commercial Operations | **NOT STARTED** | Gated on Phase 4.5 acceptance. |
| **Phase 6** | Production Deployment & Operational Hardening | **NOT STARTED** | Gated on Phase 5 acceptance. |
| **Final Gate** | End-to-End Regression Across All Phases | **NOT STARTED** | Requires full live infrastructure. |

---

## 8. Hiring Workflow & Application Lifecycle (Phase 4)

### Complete Recruitment Journey
The platform connects candidate discovery with company hiring decisions through a secure, multi-stage state machine:

```mermaid
stateDiagram-v2
    [*] --> Submitted: Candidate Submits Application
    Submitted --> In_Review: Company Reviews Profile
    Submitted --> Shortlisted: Direct Shortlist
    Submitted --> Rejected: Company Rejection
    Submitted --> Withdrawn: Candidate Withdrawal

    In_Review --> Shortlisted: Candidate Advanced
    In_Review --> Interview: Interview Scheduled
    In_Review --> Rejected: Company Rejection
    In_Review --> Withdrawn: Candidate Withdrawal

    Shortlisted --> Interview: Interview Scheduled
    Shortlisted --> Rejected: Company Rejection
    Shortlisted --> Withdrawn: Candidate Withdrawal

    Interview --> Offered: Offer Extended
    Interview --> Rejected: Candidate Rejected
    Interview --> Withdrawn: Candidate Withdrawal

    Offered --> Hired: Offer Accepted / Hire Recorded
    Offered --> Rejected: Offer Rescinded / Declined

    Hired --> [*]: Terminal Stage
    Rejected --> [*]: Terminal Stage
    Withdrawn --> [*]: Terminal Stage
```

### Application Lifecycle Rules & State Machine
1. **Centralized Service:** All status transitions are governed by `applicationLifecycleService.js` on the server.
2. **Deterministic Stages:**
   - `Submitted`: Initial stage upon valid application submission.
   - `In Review`: Application opened and acknowledged by company recruiters.
   - `Shortlisted`: Candidate earmarked for evaluation and interview scheduling.
   - `Interview`: Formal interview proposed or scheduled with date, time, and meeting details.
   - `Offered`: Employment offer extended to the candidate.
   - `Hired`: Final hiring decision confirmed and recorded.
   - `Rejected`: Terminal decision by the company (optional internal reason recorded).
   - `Withdrawn`: Terminal decision initiated exclusively by the candidate.
3. **Terminal Protection:** `Hired`, `Rejected`, and `Withdrawn` are terminal; they cannot silently transition to other states.
4. **Candidate Withdrawal:** Only the applying candidate can withdraw their own application, and only if the application is currently non-terminal (`Submitted`, `In Review`, `Shortlisted`, `Interview`).
5. **Audit Trail:** Every transition appends an entry to `statusHistory` recording `{ status, changedBy, changedAt, reason }`.

### Interview Scheduling Integration
1. **Application Linkage:** Interviews (`Interview` model) store an `applicationId` linking the interview directly to the requisition and candidate.
2. **Automatic Status Synchronization:** When a company schedules an interview for an application via `POST /api/interviews`, the backend automatically synchronizes the application status to `Interview`.
3. **Timezone & Time Validation:** Start and end times are validated (`start < end`), stored as UTC timestamps, and company/candidate timezones are preserved.
4. **Rescheduling & Cancellation:** Recruiter rescheduling and cancellations update interview state and append to the application's audit history.

### In-App Notification System
1. **Architecture:** Persisted `Notification` model with fields for `recipientUserId`, `recipientRole`, `companyId`, `type`, `title`, `message`, `link`, and `read`.
2. **Automated Event Dispatching:**
   - `application_received`: Notifies company recruiters when a new application is submitted.
   - `application_status_changed`: Notifies the candidate when their application status is updated (e.g., In Review, Shortlisted, Offered, Hired).
   - `application_withdrawn`: Notifies the company when a candidate withdraws.
   - `interview_scheduled` / `interview_rescheduled` / `interview_cancelled`: Notifies the candidate of interview events.
3. **Strict Scoping:**
   - Candidates can only query notifications where `recipientUserId === user.id`.
   - Companies can only query notifications where `companyId === user.companyId`.

### Data Protection & Recruiter Privacy
1. **Internal Notes Isolation:** Recruiter internal notes added to an application (`POST /api/applications/:id/notes`) are strictly company-private. The serializer `safeApplication()` strips `internalNotes` from any candidate-facing response.
2. **Cross-Tenant Isolation:**
   - Company A cannot access or mutate Company B's applications or schedule interviews for Company B's jobs (returns 404/403).
   - Candidate A cannot inspect, withdraw, or tamper with Candidate B's applications (returns 404/403).

---

## 9. Current Status

### Implementation Summary
- **Database Configuration Layer:** Fully implemented in `server/src/config/db.js` with credential sanitization, duplicate connection guards, strict production gating, and safe shutdown handlers.
- **Startup Protection:** Startup fails fast with exit code 1 if `MONGODB_URI` is missing and demo mode is disabled.
- **Seeding Guard:** Seeding refuses execution unless `ALLOW_DEMO_SEED=true` and `MONGODB_URI` are present.
- **Tenant Isolation:** Enforced across jobs, interviews, shortlists, messages, reports, candidate profiles, and applications.
- **Hiring Workflow (Phase 4):** Completed end-to-end between candidates and hiring companies.
- **Automated Verification:**
  - Backend Test Suite: **156 passed, 0 failed, 0 skipped** across 13 test suites (`node --test`).
  - Frontend Production Build: **Passed** (`vite build`, exit code 0).
  - Frontend Lint: **Passed** with 0 errors (`oxlint`, exit code 0).

---

## 9.5. Phase 4.5 — Secure Operations Admin Panel

Hirevoxa Phase 4.5 introduces a dedicated, high-security Operations Administration workspace mounted under `/admin`:

### Architecture & Routing
- **Frontend Workspace:** Gated by `<ProtectedRoute allowedRoles={['admin']}>` and rendered within `<AdminLayout />` using Hirevoxa's dark titanium design system (`#090909`, `#111111`, `#1B1B1B`, `#F5F5F5`).
- **Backend API Boundary:** Grouped under `/api/admin/*`, requiring both valid authentication and admin tier evaluation via `adminAuthMiddleware.js`.
- **Zero Public Admin Registration:** Public registration endpoints (`POST /api/auth/register`) strictly reject attempts to register with `role: 'admin'`. Privileged administrators can only be provisioned via the internal CLI bootstrap script (`npm run bootstrap:admin`).

### Three-Tier RBAC Hierarchy
1. **Platform Owner (`owner`):** Unrestricted operational governance, role promotion/demotion, platform settings, company verification, job moderation, unmasked audit access. Cannot demote self if sole active owner.
2. **Operations Admin (`ops_admin`):** Company verification, job moderation, user suspension, support ticketing, read permitted reports. Private recruiter notes (`feedbackNotes`) are masked. Cannot alter admin roles.
3. **Read-Only Analyst (`analyst`):** Read-only visibility into operational KPIs, user directories, companies, and jobs. All state-mutating requests (`POST`, `PATCH`, `DELETE`) return `403 Forbidden`.

### Real-Time Session Invalidation
- When a user account is suspended (`PATCH /api/admin/users/:id/suspend`), `authMiddleware.js` verifies account status on every subsequent request. Active JWT tokens belonging to suspended users fail immediately with `403 Forbidden` without waiting for token expiration.

### Formula Injection Protection
- All CSV report exports (`/api/admin/reports/export?type=...`) filter all cell values through `sanitizeCsvCell()`. Any string beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` is neutralized with a prepended single quote `'` and enclosed in quotes to protect against formula injection execution in spreadsheet viewers.

### Append-Only Audit Logging
- Every sensitive operation (bootstrap, suspension, role change, company verification, job moderation, setting update) generates an immutable `AuditLog` entry tracking actor ID, action, target resource, outcome, and timestamp. Audit logs cannot be modified or deleted via HTTP APIs.

### Live Database Status
- **MongoDB Atlas Cluster:** Connected and verified on cluster host `ac-enqdxko-shard-00-*.uvzqbhj.mongodb.net` targeting database `hirevoxa`.
- **Live Persistence Status:** Marked **VERIFIED COMPLETE**. Live database persistence across server restarts verified via controlled record insertion and separate-process query retrieval.
- **Phase 5 Boundary:** Confirmed. Commercial payments (Stripe) and subscription billing have not been started.

---

## 10. Future MongoDB Setup Checklist

Follow these 12 steps when provisioning MongoDB Atlas in the future:

1. **Access MongoDB Atlas:** Log into [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create Cluster:** Provision an M0 (Free Tier) or M10+ dedicated cluster in an appropriate cloud region (e.g., `us-east-1`).
3. **Database User:** Create a dedicated database user (e.g., `hirevoxa_app`) with least-privilege permissions (`readWrite` on `hirevoxa` database only). Generate a strong, random password.
4. **Network Access / IP Whitelist:** Configure network access in Atlas. Add the static IP of your hosting platform or configure a VPC peering connection. (For local development, add your current public IP address).
5. **Retrieve Connection String:** Obtain the standard connection string URI in the format:
   `mongodb+srv://<username>:<password>@<cluster-host>/hirevoxa?retryWrites=true&w=majority`
6. **Set Environment Variable:** In `server/.env` (or cloud environment secrets), configure:
   `MONGODB_URI=mongodb+srv://hirevoxa_app:<password>@cluster0.xxxxx.mongodb.net/hirevoxa?retryWrites=true&w=majority`
   Ensure `ALLOW_IN_MEMORY_DEMO=false` and `NODE_ENV=production` (or `development`).
7. **Verify Connectivity:** Start the server with `npm start` in `server/`. Verify the startup log:
   `[Hirevoxa DB] Connected to MongoDB cluster host: cluster0-shard-00-00.xxxxx.mongodb.net`
8. **Initialize Schemas & Indexes:** Execute schema indexing to ensure compound unique indexes (e.g., `candidateId + jobId` in `Application`) are built.
9. **Verify CRUD Persistence:** Create a test job or user via the API and confirm the document is stored in the Atlas collection.
10. **Test Restart Persistence:** Stop the backend process (`Ctrl+C`), restart the backend, and query the created record to verify persistent retrieval.
11. **Tenant Isolation Verification:** Execute `npm test` pointing to an isolated Atlas test database to confirm cross-tenant access rules on live MongoDB.
12. **Update Phase Reports:** Update `PROJECT_STATE_AND_PHASE_TRACKER.md` and phase reports, changing Phase 2B persistence status from **BLOCKED** to **VERIFIED COMPLETE**.

---

## 11. Verified Commands & Troubleshooting

### Development Commands
```bash
# Start backend API (development mode with file watching)
cd server && npm run dev

# Start frontend development server
cd client && npm run dev

# Run full backend test suite (12 suites, 144 tests)
cd server && npm test

# Build frontend production bundle
cd client && npm run build

# Run frontend lint check
cd client && npm run lint

# Seed database with explicit authorization (requires Atlas URI & opt-in flag)
cd server && ALLOW_DEMO_SEED=true MONGODB_URI="<your-uri>" npm run seed
```

### Common Configuration Failures & Fixes

| Issue / Symptom | Root Cause | Safe Resolution |
|---|---|---|
| `[Hirevoxa DB Config Error] Missing MONGODB_URI` | Server started in production or without `ALLOW_IN_MEMORY_DEMO=true` while `MONGODB_URI` is unset. | Supply a valid `MONGODB_URI` in `server/.env`. For non-production demonstration only, set `ALLOW_IN_MEMORY_DEMO=true`. |
| `[Hirevoxa DB Connection Error] Unable to connect to MongoDB` | Network timeout, incorrect credentials, or IP not whitelisted in Atlas. | Check Atlas Network Access IP whitelist, verify credentials in `.env`, and check network connectivity. |
| `[Seed] Demo seeding is disabled by default` | Ran seed command without explicit opt-in. | Supply `ALLOW_DEMO_SEED=true` in the environment when running `npm run seed`. |
| `Blocked by CORS policy` | Client request originated from an untrusted origin. | Add the client URL to `CLIENT_ORIGIN` in `server/.env`. |

---

## 12. Security and Deployment Notes

1. **Secret Management:**
   - Never commit `.env` files. Both root `.gitignore` and `client/.gitignore` exclude `.env*`.
   - Never expose `MONGODB_URI` or `JWT_SECRET` to the frontend client. Frontend variables must only use `VITE_` prefixed public configurations.
2. **Safe Logging Policy:**
   - Log scrubbers intercept error messages to mask database credentials (`sanitizeError`).
   - Console logs print only hostnames (`conn.connection.host`), never credentials or query parameters.
3. **Least Privilege Principles:**
   - Database user roles should be limited to `readWrite` on the application database.
   - Database administrative operations (drop, user management) should never be assigned to application credentials.
4. **Data Quarantine Protocol:**
   - Ambiguous or orphaned records identified during data migrations are placed in `QuarantineRecord` collections with full provenance history, preventing accidental data loss or unauthorized reassignment.

---

## 13. Final Testing Plan

When the MongoDB Atlas database is provisioned, the following end-to-end verification plan will be executed across all phases:

1. **Automated API Regression:** Execute `npm test` against the live MongoDB instance to verify all 144 test cases pass against a real database engine.
2. **Server Restart Persistence Test:**
   - Create organization and requisition documents via API.
   - Terminate the Node.js process.
   - Relaunch the server and verify all created records are intact.
3. **Cross-Tenant Mutation Security Test:** Verify that Company A cannot alter Company B's records in live MongoDB collections.
4. **Browser End-to-End Test:** Execute browser automated journeys verifying:
   - User registration and login.
   - Session cookie retention across browser reloads.
   - Job creation, editing, and candidate matching.
   - Candidate application and resume upload.
5. **Formal Phase Acceptance:** Sign off Phase 2B as **VERIFIED COMPLETE** and officially unblock Phase 3.
