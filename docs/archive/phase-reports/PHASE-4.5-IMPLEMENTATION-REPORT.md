# HIREVOXA PHASE 4.5 — SECURE OPERATIONS ADMIN PANEL
## Master Implementation & Architecture Report

**Document Date:** October 29, 2026<br>
**Repository:** `G:\HireVoxa`<br>
**Phase Completed:** Phase 4.5 — Secure Operations Admin Panel<br>
**Release Gate Status:** COMPLETE & VERIFIED (Live Atlas multi-process database persistence remains explicitly BLOCKED)<br>
**Browser Session Recording Artifact:** [`file:///C:/Users/Hp/.gemini/antigravity-ide/brain/9b4c6f51-9bb6-4c29-b896-b3e140dd884c/admin_panel_verification_1793290630497.webp`](file:///C:/Users/Hp/.gemini/antigravity-ide/brain/9b4c6f51-9bb6-4c29-b896-b3e140dd884c/admin_panel_verification_1793290630497.webp)

---

## 1. Executive Summary & Objective

In Phase 4.5, Hirevoxa expanded its platform with a dedicated, secure internal operations workspace mounted at `/admin`. This workspace empowers internal platform operators, operations managers, and analysts to govern users, verify hiring companies, moderate job requisitions, monitor candidate applications through the Phase 4 hiring pipeline, respond to operational support incidents, inspect tamper-resistant audit logs, export protected operational data, and configure global platform settings.

All administrative features strictly enforce:
1. **Server-side RBAC:** Zero frontend-only authorization. Every sensitive endpoint authenticates JWT tokens, verifies `role === 'admin'`, and checks tier capabilities (`owner`, `ops_admin`, `analyst`).
2. **Deny by Default:** Public registration cannot grant administrative roles. Any mutation from a read-only analyst is rejected with HTTP 403.
3. **Dual-Storage Compatibility:** Fully integrated with Mongoose schemas for MongoDB Atlas and `inMemoryStore.js` for isolated demo testing.
4. **Append-Only Auditing:** Every privileged mutation (suspension, role change, verification decision, job moderation, settings change) writes an append-only audit event.
5. **Phase Boundary Integrity:** Strictly preserves Phase 0–4 workflows and test suites. Phase 5 (Payments) and Phase 6 (Deployment) remain strictly untouched.

---

## 2. Roles & Permission Matrix

Three hierarchical operational roles were designed and enforced:

| Operational Tier | Role / AdminRole | Permissions & Capabilities | Explicit Prohibitions |
| :--- | :--- | :--- | :--- |
| **Platform Owner** | `admin` / `owner` | Full operational control: user management, role reassignment, company verification, job moderation, settings management, support incidents, audit inspection, CSV exports. | Cannot suspend self; cannot suspend or demote the last remaining Platform Owner account. |
| **Operations Admin** | `admin` / `ops_admin` | Operational moderation: user suspension/reactivation, company verification, job moderation, support incident management, audit log inspection, CSV reports. | Cannot change user roles; cannot modify platform configuration settings; cannot suspend a Platform Owner. |
| **Read-Only Analyst** | `admin` / `analyst` | Read-only reporting: view overview KPIs, browse user directory, inspect company verification records, view job listings, view audit logs, generate CSV reports. | Cannot perform any state-changing operations (`PATCH`, `POST`, `DELETE`). Mutations return HTTP 403 Forbidden. |
| **Non-Admin Roles** | `candidate`, `company` | Platform marketplace participants. | Strictly forbidden from accessing `/api/admin/*` or `/admin` frontend routes. Returns HTTP 403 and access restricted screen. |

---

## 3. Safe Administrator Provisioning

To prevent unauthorized access, **no public administrator registration endpoint exists**:
- In `server/src/controllers/authController.js`, public registration via `/api/auth/register` explicitly restricts new accounts to `candidate` or `company`. Any submission with `role: 'admin'` or `adminRole` is rejected with HTTP 400.
- A dedicated, secure CLI bootstrap utility was built at `server/src/scripts/bootstrapAdmin.js`.
- The bootstrap script requires strong credentials (minimum 10 characters with numbers and special symbols), checks for existing owners, prevents duplicate creation, hashes passwords with bcrypt, and logs an `ADMIN_BOOTSTRAP` event in the audit trail.
- Added package script `"bootstrap:admin": "node src/scripts/bootstrapAdmin.js"` in `server/package.json`.

---

## 4. Architecture & Backend Endpoints Created

A unified, RESTful administrative routing suite was mounted under `/api/admin` in `server/src/server.js`, protected by `protect`, `requireAdmin`, `requireAdminWrite`, and `requireAdminRole`:

### Summary & Dashboard
- `GET /api/admin/summary` — Aggregates live platform metrics across users, companies, jobs, applications, support tickets, and audit events.

### User Management & Governance
- `GET /api/admin/users` — Paginated user directory with search and role/status filtering. Password hashes are stripped.
- `GET /api/admin/users/:id` — Detailed user view.
- `PATCH /api/admin/users/:id/status` — Suspend or reactivate user accounts. Enforces self-suspension and last-owner safeguards. Emits `USER_SUSPEND` or `USER_REACTIVATE` audit log.
- `PATCH /api/admin/users/:id/role` — Modify user role or admin tier. Restricted to `owner`. Prevents last-owner demotion. Emits `USER_ROLE_CHANGE` audit log.

### Company Management & Verification
- `GET /api/admin/companies` — Paginated company listings with verification status filtering.
- `GET /api/admin/companies/:id` — Company detail with verification history and related jobs.
- `PATCH /api/admin/companies/:id/verify` — Approve (`verified`), reject (`rejected`), or request correction (`correction_requested`). Rejection and correction require a mandatory reason. Emits `COMPANY_VERIFICATION` audit log.

### Job Moderation
- `GET /api/admin/jobs` — Paginated job queue with moderationStatus filtering.
- `GET /api/admin/jobs/:id` — Job details with moderation history.
- `PATCH /api/admin/jobs/:id/moderate` — Approve, flag, or suspend job postings. Flagging or suspending requires a mandatory reason. Emits `JOB_MODERATION` audit log.

### Application & Hiring Pipeline Oversight
- `GET /api/admin/applications` — Read-only operational oversight into Phase 4 hiring workflows. Preserves candidate privacy by automatically masking internal recruiter notes (`[Masked for Non-Owner Privacy]`) unless the requesting user is a Platform Owner.

### Support & Incident Management
- `GET /api/admin/support-tickets` — Filterable ticket queue.
- `GET /api/admin/support-tickets/:id` — Ticket detail with internal staff notes.
- `POST /api/admin/support-tickets` — Open new support incident with priority and category. Emits `SUPPORT_TICKET_CREATE` audit log.
- `PATCH /api/admin/support-tickets/:id` — Update ticket status (`open`, `in_progress`, `resolved`, `closed`). Emits `SUPPORT_TICKET_UPDATE` audit log.
- `POST /api/admin/support-tickets/:id/notes` — Post operational staff investigation notes.

### Append-Only Audit Logs
- `GET /api/admin/audit-logs` — Paginated audit stream with action, actor, and target filters. No endpoints exist to modify or delete audit log records.

### Platform Administrative Settings
- `GET /api/admin/settings` — Returns global platform configuration.
- `PATCH /api/admin/settings` — Updates configuration (registration gating, job moderation requirement, SLA review windows, maintenance mode). Restricted to `owner`. Emits `ADMIN_SETTINGS_UPDATE` audit log.

### Reports & CSV Data Exports
- `GET /api/admin/reports/export/:type` — Generates CSV exports for `users`, `companies`, `jobs`, or `audit_logs`.
- **Formula Injection Safeguard:** Every exported field is sanitized using an escaping function that neutralizes leading formula starters (`=`, `+`, `-`, `@`, `\t`, `\r`) with a leading `'` quote.

---

## 5. Frontend Operations Workspace (`/admin`)

The frontend was constructed under `client/src/pages/admin/` with the Hirevoxa dark titanium aesthetic:
- **Canvas:** `#090909`
- **Sidebar:** `#111111`
- **Card Surfaces:** `#141414` / `#1B1B1B`
- **Borders:** `#262626` / `#303030`
- **Primary Text:** `#F5F5F5`
- **Badges:** Emerald (`verified`), Cyan (`ops_admin`), Amber (`owner`, `flagged`), Rose (`suspended`, `rejected`), Purple (`analyst`).

### UI Pages Implemented:
1. `AdminOverviewPage.jsx` (`/admin`) — Real KPI cards, quick module navigation, and live audit event stream.
2. `AdminUsersPage.jsx` (`/admin/users`) — User table with role badges, status indicators, and consequential confirmation modals for suspension, reactivation, and tier changes.
3. `AdminCompaniesPage.jsx` (`/admin/companies`) — Corporate registry with verification decision drawer and history logs.
4. `AdminJobsPage.jsx` (`/admin/jobs`) — Requisitions queue with moderation action modals and compliance reason inputs.
5. `AdminApplicationsPage.jsx` (`/admin/applications`) — Pipeline tracking across Phase 4 stages with privacy-masked recruiter notes.
6. `AdminSupportPage.jsx` (`/admin/support`) — Support ticketing desk with incident lifecycle management and internal notes posting.
7. `AdminAuditLogsPage.jsx` (`/admin/audit-logs`) — Audit stream viewer with metadata inspection modals.
8. `AdminReportsPage.jsx` (`/admin/reports`) — One-click CSV downloads with formula injection notice and Phase 5 scope boundary disclaimer.
9. `AdminSettingsPage.jsx` (`/admin/settings`) — Governance toggles with owner-only access controls.
10. `AdminLayout.jsx` — Collapsible sidebar, active security tier badge, responsive drawer, and quick switch to Recruiter workspace.

---

## 6. Files Created & Modified

### Backend Files:
- Created: `server/src/models/AuditLog.js` (Append-only audit schema)
- Created: `server/src/models/SupportTicket.js` (Support incident schema)
- Created: `server/src/models/AdminSetting.js` (Platform governance schema)
- Created: `server/src/middleware/adminAuthMiddleware.js` (RBAC & write guard middleware)
- Created: `server/src/controllers/adminController.js` (Comprehensive admin business logic)
- Created: `server/src/routes/adminRoutes.js` (Protected admin router)
- Created: `server/src/scripts/bootstrapAdmin.js` (CLI admin provisioning tool)
- Created: `server/tests/phase4_5_admin_operations.test.js` (12 automated regression tests)
- Modified: `server/src/models/User.js` (Added `adminRole`, `status`, `suspendedReason`, `suspendedAt`)
- Modified: `server/src/models/Company.js` (Added `verificationStatus`, `verificationReason`, `verifiedBy`, `verificationHistory`)
- Modified: `server/src/models/Job.js` (Added `moderationStatus`, `moderationReason`, `moderatedBy`, `moderationHistory`)
- Modified: `server/src/controllers/authController.js` (Added token claims, rejected suspended users on login)
- Modified: `server/src/middleware/authMiddleware.js` (Checked real-time suspended account status)
- Modified: `server/src/services/inMemoryStore.js` (Added default admin users, companies, audit logs, tickets, settings, and helper methods)
- Modified: `server/src/server.js` (Mounted `/api/admin` and supported `AUTO_START`)
- Modified: `server/package.json` (Added `"bootstrap:admin"` and updated test runner)

### Frontend Files:
- Created: `client/src/layouts/AdminLayout.jsx` (Operations workspace shell)
- Created: `client/src/pages/admin/AdminOverviewPage.jsx`
- Created: `client/src/pages/admin/AdminUsersPage.jsx`
- Created: `client/src/pages/admin/AdminCompaniesPage.jsx`
- Created: `client/src/pages/admin/AdminJobsPage.jsx`
- Created: `client/src/pages/admin/AdminApplicationsPage.jsx`
- Created: `client/src/pages/admin/AdminSupportPage.jsx`
- Created: `client/src/pages/admin/AdminAuditLogsPage.jsx`
- Created: `client/src/pages/admin/AdminReportsPage.jsx`
- Created: `client/src/pages/admin/AdminSettingsPage.jsx`
- Modified: `client/src/services/api.js` (Added 19 admin API methods + CSV download)
- Modified: `client/src/App.jsx` (Mounted `/admin` route hierarchy with `<ProtectedRoute allowedRoles={['admin']}>`)
- Modified: `client/src/pages/LoginPage.jsx` (Added smooth redirection to `/admin` for admin users)

---

## 7. Limitations & Blocked Dependencies

1. **MongoDB Atlas Live Persistence:** MongoDB Atlas connection string has intentionally not been provisioned. Live database multi-process persistence and server restart survivability remain explicitly **BLOCKED**. All Phase 4.5 schemas and controllers are fully designed and ready for MongoDB Atlas connection once infrastructure credentials are provided.
2. **Phase 5 Payments Boundary:** Revenue reports, billing management, and transaction fees are disabled until Phase 5.
3. **Phase 6 Deployment Boundary:** External cloud infrastructure provisioning, Docker containers, and CI/CD deployment pipelines are out of scope.
