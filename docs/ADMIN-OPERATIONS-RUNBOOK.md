# HIREVOXA PHASE 4.5 — SECURE OPERATIONS ADMIN PANEL RUNBOOK
**Document Version:** 1.0.0<br>
**Target Environment:** Local Development / Testing / Operational Governance<br>
**Audience:** Platform Architects, Operations Administrators, Site Reliability Engineers<br>
**Classification:** Internal Confidential / Administrative Operations<br>

---

## 1. SYSTEM OVERVIEW & ARCHITECTURAL FOUNDATION

Hirevoxa Phase 4.5 introduces a dedicated, high-security Operations Administration workspace (`/admin`) designed for operational governance, verification of hiring companies, moderation of job listings, dispute management via support tickets, auditing of administrative interventions, and generation of formula-safe CSV analytics.

### Architecture Highlights
- **Frontend:** React 19 / Vite 8 SPA mounted at `/admin` under `<AdminLayout />`, styled with a dark titanium aesthetic (`#090909` canvas, `#111111` sidebar, `#1B1B1B` card surfaces, `#F5F5F5` typography).
- **Backend:** Node.js / Express 4.21 with JWT-authenticated RBAC at `/api/admin/*`.
- **Database Abstraction:** Dual-mode architecture supporting live MongoDB via Mongoose 8.10 or an isolated in-memory demonstration adapter (`inMemoryStore.js`).
- **Authorization Guard:** Server-side verification enforcing role hierarchy (`owner` > `ops_admin` > `analyst`) with real-time token invalidation upon account suspension.

---

## 2. STARTING THE APPLICATION

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Available ports: `5000` (Backend API) and `5173` (Frontend Client)

### Starting the Backend Server
From the project root:
```bash
cd G:\HireVoxa\server
npm run dev
```
*Note on Persistence:*
- If `MONGODB_URI` is provided in `.env`, the server connects to MongoDB Atlas.
- If `MONGODB_URI` is absent or unconfigured and `ALLOW_IN_MEMORY_DEMO=true` is set, the server boots in `in-memory-demo` mode with pre-seeded demo records (`owner@hirevoxa.internal`, `ops@hirevoxa.internal`, `analyst@hirevoxa.internal`).
- When operating in `in-memory-demo` mode, changes persist only during the runtime of that specific process. Restarting the server resets state to the default seed fixture.

### Starting the Frontend Client
In a separate terminal:
```bash
cd G:\HireVoxa\client
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 3. SECURE ADMINISTRATOR PROVISIONING

### Principle of Zero Public Admin Registration
Public registration endpoints (`POST /api/auth/register`) strictly reject attempts to register with `role: 'admin'`. Privileged administrators can only be provisioned through the internal CLI bootstrap utility.

### Bootstrapping the Platform Owner
Run the secure CLI bootstrap script from the `server/` directory:

```bash
cd G:\HireVoxa\server

# For standard environments (MongoDB configured):
npm run bootstrap:admin -- --email "admin@hirevoxa.com" --name "Lead Platform Owner" --password "SuperSecretPass123!"

# For local in-memory demo mode:
npm run bootstrap:admin -- --email "admin@hirevoxa.com" --name "Lead Platform Owner" --password "SuperSecretPass123!" --demo
```

#### Bootstrap Security Rules & Validation:
1. **Password Entropy:** Enforces minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`[!@#$%^&*(),.?":{}|<>]`).
2. **First-Owner Invariant:** If a Platform Owner already exists, the script prevents re-initialization unless `--force` is explicitly provided.
3. **Audit Logging:** Every bootstrap invocation creates an immutable `AuditLog` entry tracking the provisioned actor, outcome, and metadata.
4. **No Hardcoded Defaults:** The script requires explicit argument input and will never default to insecure credentials like `admin:admin`.

---

## 4. ROLES AND PERMISSION HIERARCHY

The platform enforces a strict three-tier administrative hierarchy. Non-admin roles (`company`, `candidate`) receive immediate `403 Forbidden` responses when querying `/api/admin/*`.

| Role Identifier | Role Title | Read Permissions | Mutation Permissions | Scope Limitations |
| :--- | :--- | :--- | :--- | :--- |
| `owner` | Platform Owner | Full Platform Metrics, Users, Companies, Jobs, Applications, Tickets, Audit Logs, Settings | User suspension/reactivation, Admin role promotion/demotion, Company verification, Job moderation, Ticket resolution, Platform setting updates | None (Cannot demote self if sole owner) |
| `ops_admin` | Operations Admin | Metrics, Users, Companies, Jobs, Applications, Tickets, Audit Logs, Settings | User suspension/reactivation (non-owners only), Company verification, Job moderation, Support ticket management | Cannot alter admin roles (`adminRole`); cannot modify platform settings; recruiter notes masked |
| `analyst` | Read-Only Analyst | Summary KPI cards, User list, Company list, Job list, Reports, Audit Logs (read-only) | **None** (Deny-by-default; all POST/PATCH/DELETE return `403 Forbidden`) | Strictly read-only; cannot view unmasked internal recruiter notes |

### Critical Safeguards:
- **Last Owner Protection:** An `owner` cannot demote their own account or suspend their own account if they are the last active Platform Owner.
- **Privilege Escalation Prevention:** Generic profile updates (`PUT /api/auth/profile`) strip privileged fields (`role`, `adminRole`, `status`). Only `PATCH /api/admin/users/:id/role` can alter tiers, restricted exclusively to `owner`.
- **Immediate Token Revocation:** `authMiddleware.js` checks the active user record on every authenticated request. When an account is suspended, all existing active JWT sessions for that user fail immediately with `403 Forbidden` without waiting for token expiry.

---

## 5. STANDARD OPERATIONAL WORKFLOWS

### Workflow A: Investigating and Suspending an Abusive User
1. Navigate to `/admin/users` via the sidebar.
2. Search by email or name, or filter by role (`candidate`, `company`, `admin`).
3. Inspect user registration timestamp and status.
4. Click **Suspend Account**.
5. Enter a required suspension reason (e.g., *Fraudulent resume credentials detected*).
6. Confirm action. The user status immediately transitions to `suspended`.
7. Verify that an append-only event is recorded under `/admin/audit-logs`.

### Workflow B: Company Verification
1. Navigate to `/admin/companies`.
2. Filter by status: `Pending Review`.
3. Click on a company record to review its profile, website, tax ID/EIN, and contact details.
4. Select one of the three operational decisions:
   - **Approve & Verify:** Marks company as `verified`.
   - **Request Correction:** Retains pending status; records specific correction items required.
   - **Reject:** Sets status to `rejected`; requires a clear operational justification.
5. Provide the mandatory reason in the confirmation modal.
6. The decision is timestamped and recorded in the company's `verificationHistory` array and the platform `AuditLog`.

### Workflow C: Job Listing Moderation
1. Navigate to `/admin/jobs`.
2. Filter listings by `Pending Review` or `Flagged`.
3. Inspect job description, salary range, remote policies, and hiring company.
4. Actions available:
   - **Approve:** Transitions moderation status to `approved`.
   - **Flag for Review:** Leaves listing unapproved while requesting edits from employer.
   - **Suspend Listing:** Immediately removes listing from candidate search visibility.
5. Enter the moderation reason. All transitions append to `moderationHistory`.

### Workflow D: Application Oversight & Privacy Protection
1. Navigate to `/admin/applications`.
2. Inspect pipeline bottlenecks across Phase 4 stages: `submitted`, `screening`, `interview_scheduled`, `offered`, `hired`, `rejected`.
3. **Data Protection Note:** Private internal recruiter notes (`feedbackNotes`) are automatically masked as `[Masked for Non-Owner Privacy]` for `ops_admin` and `analyst` accounts. Only a authenticated `owner` with legitimate governance need can view unmasked feedback.

### Workflow E: Managing Support Tickets
1. Navigate to `/admin/support`.
2. Filter tickets by priority (`high`, `urgent`) or status (`open`, `in_progress`).
3. Click a ticket to inspect user query, system logs, and internal notes.
4. Update ticket status or assign to an active operator.
5. Add internal resolution notes. Internal notes are visible solely within the admin panel.

---

## 6. AUDIT LOGGING & COMPLIANCE

Every sensitive mutation in the admin workspace triggers an append-only audit event.

### Audit Record Schema
```json
{
  "id": "audit-uuid",
  "actorId": "user-uuid",
  "actorEmail": "ops@hirevoxa.internal",
  "actorRole": "ops_admin",
  "action": "company.verified",
  "targetType": "company",
  "targetId": "comp-123",
  "outcome": "success",
  "reason": "Verified Delaware registration and official domain match",
  "timestamp": "2026-10-29T16:19:00.000Z"
}
```

### Immutable Security Constraints
- Ordinary HTTP API endpoints provide no `PUT`, `PATCH`, or `DELETE` methods for audit logs.
- Sensitive credentials, passwords, session tokens, and raw resume files are strictly stripped before logging.
- Audit logs are accessible to all admin tiers via `/admin/audit-logs` for compliance review.

---

## 7. REPORTS & FORMULA INJECTION-SAFE EXPORTS

### Export Capabilities
From `/admin/reports`, administrators can download real-time CSV reports:
- User Governance Registry (`admin-users.csv`)
- Company Verification Audit (`admin-companies.csv`)
- Job Moderation Activity (`admin-jobs.csv`)
- Comprehensive Audit Log (`admin-audit-logs.csv`)

### Formula Injection Protection (CSV Sanitization)
To prevent CSV Injection / Remote Code Execution when opened in Microsoft Excel or Google Sheets, all exported cell values are processed by `sanitizeCsvCell()` in `server/src/controllers/adminController.js`:
- Any cell string beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` is automatically neutralized by prepending a single quote `'` and enclosing the string in quotes.

---

## 8. HANDLING DATABASE FAILURES & UNAVAILABLE ADAPTERS

### Detecting Database Status
- The server checks connection state via `database.js`.
- If MongoDB Atlas is disconnected or fails health check, `getDatabaseStatus()` reports `status: 'unavailable'`.

### Graceful Fallback Behavior
1. In development, setting `ALLOW_IN_MEMORY_DEMO=true` routes queries to `inMemoryStore.js`.
2. If both MongoDB and in-memory demo are disabled, admin endpoints return HTTP `503 Service Unavailable`:
   ```json
   {
     "success": false,
     "error": "Database connection is not available and demo mode is disabled",
     "code": "DATABASE_UNAVAILABLE"
   }
   ```
3. The Admin UI renders an honest `Status: Disconnected (Demo Mode / Unavailable)` indicator on the dashboard rather than fabricating data.

---

## 9. FUTURE INFRASTRUCTURE REQUIREMENTS

The following items are deliberately deferred to future development phases:
1. **Phase 5 (Payments):** Stripe integration, billing subscriptions, recruiter credit top-ups, and financial revenue reporting.
2. **Phase 6 (Production Deployment):** MongoDB Atlas live cluster provisioning, Redis session store clustering, CDN asset hosting, and automated TLS certificate rotation.

---
*End of Runbook — Hirevoxa Operations Engineering*
