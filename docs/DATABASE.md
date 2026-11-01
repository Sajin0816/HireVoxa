# Hirevoxa — Database Architecture & Configuration

**Document Version:** 2.0.0<br>
**Location:** `docs/DATABASE.md`<br>
**Target Engine:** MongoDB 7.0+ / MongoDB Atlas (Replica Set)<br>
**Object Data Mapper (ODM):** Mongoose 8.10+

---

## 1. Connection Lifecycle & Resilience

The database layer is managed by [`server/src/config/db.js`](file:///g:/HireVoxa/server/src/config/db.js) and initialized during server startup ([`server/src/server.js`](file:///g:/HireVoxa/server/src/server.js)).

### Key Features
1. **Multi-Attempt Transient Retry:** Upon encountering network or TLS negotiation hiccups, `connectDB()` automatically retries up to 3 times with a 2,000ms backoff before failing.
2. **Credential Sanitization:** All connection URIs, stack traces, and driver errors are passed through `sanitizeError()`, which replaces `mongodb+srv://user:pass@host` with `mongodb+srv://user:***@host` to ensure zero credential leaks in logs.
3. **Environment Isolation & Guardrails:**
   - In production or when `REQUIRE_DB=true`, in-memory fallback is strictly disallowed.
   - When running automated test suites (`NODE_ENV=test`), tests are isolated to `inMemoryStore.js` unless `TEST_WITH_LIVE_DB=true`.
4. **Target Database Enforcement:** The connection string explicitly binds to `dbName: 'hirevoxa'`.

### Connectivity Verification
Verify live Atlas connectivity without starting the Express server:
```bash
npm --prefix server run db:check
```

---

## 2. Core Collections & Schemas

### A. Authentication & Identity
- **`users` ([`User.js`](file:///g:/HireVoxa/server/src/models/User.js)):**
  - Fields: `name`, `email` (unique lowercase), `password` (bcrypt hashed), `role` (`'company' | 'candidate' | 'admin'`), `adminRole` (`'owner' | 'ops_admin' | 'analyst' | null`), `status` (`'active' | 'suspended'`), `companyId`, `companyName`, `isDemoRecord`.
  - Indexes: `{ email: 1 }` (unique), `{ companyId: 1 }`, `{ status: 1 }`.
- **`companies` ([`Company.js`](file:///g:/HireVoxa/server/src/models/Company.js)):**
  - Fields: `name`, `tenantKey` (unique sparse), `ownerId` (User `_id`), `authorizedMembers` (`[String]`), `verificationStatus` (`'pending' | 'verified' | 'rejected' | 'correction_requested'`), `plan` (`'starter' | 'pro'`), `subscriptionId`.
  - Indexes: `{ ownerId: 1 }`, `{ name: 1 }`, `{ verificationStatus: 1 }`.

### B. Candidate Portal
- **`candidates` ([`Candidate.js`](file:///g:/HireVoxa/server/src/models/Candidate.js)):**
  - Fields: `userId` (unique sparse), `name`, `title`, `country`, `city`, `timeZone`, `skills` (`[String]`), `yearsOfExperience`, `summary`, `seniority`, `availability`, `employmentPreference`, `compensationExpectation`, `workExperience`, `education`, `portfolioUrl`, `githubUrl`, `linkedinUrl`.
  - Indexes: `{ userId: 1 }` (unique sparse), `{ skills: 1 }`, `{ country: 1 }`, `{ yearsOfExperience: 1 }`.
- **`resumes` ([`Resume.js`](file:///g:/HireVoxa/server/src/models/Resume.js)):**
  - Fields: `candidateUserId`, `originalFilename`, `storagePath`, `fileSizeBytes`, `mimeType`, `sha256`, `versionNumber`, `isActive`.
  - Indexes: `{ candidateUserId: 1, isActive: 1 }`.

### C. Requisitions & Hiring Lifecycle
- **`jobs` ([`Job.js`](file:///g:/HireVoxa/server/src/models/Job.js)):**
  - Fields: `companyId`, `postedBy`, `title`, `description`, `department`, `requiredSkills`, `minimumExperience`, `employmentType`, `budgetRange`, `timeZoneOverlapRequirements`, `status` (`'Draft' | 'Open' | 'On Hold' | 'Fulfilled'`), `moderationStatus` (`'approved' | 'pending' | 'flagged' | 'suspended'`).
  - Indexes: `{ companyId: 1, status: 1 }`, `{ status: 1 }`, `{ requiredSkills: 1 }`.
- **`applications` ([`Application.js`](file:///g:/HireVoxa/server/src/models/Application.js)):**
  - Fields: `candidateUserId`, `candidateId`, `jobId`, `companyId`, `status` (`'Submitted' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected' | 'Withdrawn'`), `coverNote`, `internalNotes` (masked from candidate), `statusHistory`.
  - Indexes: `{ candidateUserId: 1, jobId: 1 }` (unique compound index preventing duplicate applications), `{ companyId: 1, jobId: 1, status: 1 }`.
- **`interviews` ([`Interview.js`](file:///g:/HireVoxa/server/src/models/Interview.js)):**
  - Fields: `companyId`, `createdBy`, `candidateId`, `jobId`, `applicationId`, `candidateName`, `jobTitle`, `interviewType`, `proposedDate`, `timeZone`, `meetingLink`, `status` (`'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled'`).
  - Indexes: `{ companyId: 1, status: 1 }`, `{ candidateId: 1 }`, `{ jobId: 1 }`, `{ applicationId: 1 }`.

### D. Governance & Monetization
- **`auditlogs` ([`AuditLog.js`](file:///g:/HireVoxa/server/src/models/AuditLog.js)):** Append-only audit records capturing actor, action, target resource, outcome, and client IP.
- **`adminsettings` ([`AdminSetting.js`](file:///g:/HireVoxa/server/src/models/AdminSetting.js)):** Global platform configuration keyed by setting key with encrypted/masked secrets.
- **`supporttickets` ([`SupportTicket.js`](file:///g:/HireVoxa/server/src/models/SupportTicket.js)):** Customer incident records with status, priority, and operator assignments.
- **`subscriptions` ([`Subscription.js`](file:///g:/HireVoxa/server/src/models/Subscription.js)):** Employer Pro recurring memberships ($199/mo).
- **`placementfees` ([`PlacementFee.js`](file:///g:/HireVoxa/server/src/models/PlacementFee.js)):** Permanent hire placement fee records ($2,500/placement).
- **`invoices` ([`Invoice.js`](file:///g:/HireVoxa/server/src/models/Invoice.js)):** Itemized tax and billing invoices in integer cents (USD).
