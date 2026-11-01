# Hirevoxa — Platform Administrator Persona Test Report

**Persona:** Platform Administrator (Owner Role)<br>
**Email:** `qa_admin_ops@hirevoxa.internal`<br>
**Assessment Date:** 2026-10-31<br>
**Auditor:** Application Security Engineer & Principal Software Architect

---

## 1. Scope of Assessment

This report details the evaluation of the Operations Administrator experience on the live Hirevoxa platform, covering admin authentication, RBAC authorization guards, marketplace metrics aggregation, user management, company moderation, job moderation, cross-persona application oversight, audit logging, and monetization administration.

---

## 2. Test Execution Breakdown

### 2.1 Admin Authentication & Route Protection
- **Bootstrap Execution:** Initialized secure admin test owner via `server/src/scripts/bootstrapAdmin.js`. Password single-hashed and stored in MongoDB Atlas.
- **Login Verification (`/login`):** Submitted credentials. Authenticated and cleanly redirected to `/admin` (Admin Overview).
- **Protected Route Guards:** Verified unauthenticated requests to `/admin/*` are immediately redirected to `/login` with 401/403 challenges.

### 2.2 Marketplace Overview (`/admin`)
- **Real-Time Aggregations:** Inspected operational dashboard cards:
  - Total Users: Dynamic count reflects all registered candidates, companies, and staff.
  - Active Companies: Reflects verified and pending employer organizations.
  - Moderated Jobs: Reflects platform-wide open, draft, and closed positions.
  - Active Incidents: 0 active system anomalies reported.

### 2.3 User Management (`/admin/users`)
- **Registry Inspection:** Filtered user directory.
- **Cross-Persona Verification:** Verified presence of both test accounts:
  1. *Hiring Manager QA* (`qa_employer_northstar@hirevoxa.internal`) — Role: `company`
  2. *Alex Morgan QA* (`qa_candidate_alexmorgan@hirevoxa.internal`) — Role: `candidate`
- **Status Controls:** Inspected account activation, suspension toggles, and metadata inspection modals.

### 2.4 Company & Job Moderation (`/admin/companies` & `/admin/jobs`)
- **Company Verification Queue:** Inspected "Northstar Technologies QA" record. Verified company metadata, owner linkage, and verification status.
- **Job Moderation Table:** Inspected "Full-Stack Software Engineer" listing. Verified requisition parameters, skill requirements, compensation bounds, and company ownership.

### 2.5 Cross-Persona Application Oversight (`/admin/applications`)
- **Platform Application Ledger:** Located application `6ae51ad65437539d4378ba46`.
- **Relationship Verification:** Confirmed accurate linkage between candidate Alex Morgan QA, employer Northstar Technologies QA, and job Full-Stack Software Engineer.
- **Lifecycle Tracking:** Observed status progression through `Interview` and `Hired`.

### 2.6 Audit Trail & Security Logs (`/admin/audit-logs`)
- **Immutable Log:** Confirmed all platform administrative events, account provisioning actions, and security-sensitive mutations were written to the `auditlogs` collection with actor ID, action name, target type, outcome (`success`), and IP address metadata.

### 2.7 Monetization & Billing Administration (`/admin/billing`)
- **Commercial Model Oversight:** Verified transparency of the agreed commercial structure:
  - Candidate: Free forever ($0)
  - Employer Starter: Free ($0)
  - Successful Placement: $2,500
  - Employer Pro: $199 / month
- **Ledger Records:** Verified placement fee record `PLF-2026-C1BCA46B` generated for Northstar Technologies QA.

---

## 3. Results Summary

| Feature | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Admin Authentication | Login and route to `/admin` | Authenticated and routed to overview | **PASS** |
| Admin Overview Metrics | Aggregate live database counts | Rendered live user, company, and job metrics | **PASS** |
| User Registry | Display all users across personas | Displayed Hiring Manager QA and Alex Morgan QA | **PASS** |
| Company Moderation | List employer organizations | Rendered Northstar Technologies QA | **PASS** |
| Job Moderation | Moderate platform postings | Rendered Full-Stack Software Engineer | **PASS** |
| Application Oversight | Inspect global applications | Rendered Alex Morgan & Northstar application | **PASS** |
| Audit Trail | Immutable security log entries | Confirmed audit records in Atlas | **PASS** |
| Commercial Oversight | Monitor subscriptions & placement fees | Displayed $2,500 placement fee metrics | **PASS** |
