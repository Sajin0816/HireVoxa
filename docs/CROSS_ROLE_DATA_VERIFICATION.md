# Hirevoxa — Cross-Role Data Verification & Consistency Matrix

**Audit Date:** 2026-10-31<br>
**Auditor:** Database Engineer & Application Security Engineer<br>
**Objective:** Verify data consistency, cross-role synchronization, and multi-tenant isolation across all three personas interacting with connected records in MongoDB Atlas.

---

## 1. Shared Record Consistency Matrix

The exact same test records were verified across all three user personas:

| Test Entity | Persona A (Employer) | Persona B (Candidate) | Persona C (Admin) | Atlas Consistency |
|---|---|---|---|---|
| **Employer User** | Owns session & profile | Sees company name on jobs | Sees in `/admin/users` | **100% Consistent** (`6ae50cfc5437539d4378b840`) |
| **Candidate User** | Sees name & profile on app | Owns session & profile | Sees in `/admin/users` | **100% Consistent** (`6ae50e195437539d4378b86b`) |
| **Job Listing** | Created & manages requisition | Discovered & applied to | Moderates in `/admin/jobs` | **100% Consistent** (`6ae50d935437539d4378b865`) |
| **Job Application** | Received in inbox; updated | Tracked in my applications | Oversees in global list | **100% Consistent** (`6ae51ad65437539d4378ba46`) |
| **Interview Session** | Created; rendered on calendar | Notified; viewed in detail | Aggregated in metrics | **100% Consistent** (`6ae520675437539d4378ba90`) |
| **Hiring Transition** | Moved Offered &rarr; Hired | Status updated to Hired | Activity recorded | **100% Consistent** (Application Status: `Hired`) |
| **Placement Fee** | Rendered in `/app/payments` | Zero financial liability ($0) | Monitored in `/admin/billing`| **100% Consistent** (`PLF-2026-C1BCA46B`, $2,500) |

---

## 2. Multi-Tenant Data Isolation & Security Verification

Strict tenant boundary enforcement was tested and confirmed:

### A. Employer-to-Employer Isolation
- **Test:** Can Company B access or modify Northstar Technologies QA's private jobs or applications?
- **Result:** **PASS**. All job mutations, candidate shortlists, and interview schedules require authenticated `req.user.companyId`. Database queries enforce `{ companyId: req.user.companyId }`. Company B receives `404 Not Found` or `403 Forbidden` if attempting to reference Company A document IDs.

### B. Candidate Privacy & Resume Isolation
- **Test:** Can unauthorized employers access candidate resumes before application submission?
- **Result:** **PASS**. Resumes are secured behind [resumeStorage.js](file:///G:/HireVoxa/server/src/services/resumeStorage.js). Candidate download endpoints verify ownership. Employer download endpoints require an active `Application` document referencing the resume for a job owned by that employer.

### C. Role Privilege Escalation Protection
- **Test:** Can candidate or employer accounts invoke administrative routes (`/api/admin/*`)?
- **Result:** **PASS**. Handled by [adminAuthMiddleware.js](file:///G:/HireVoxa/server/src/middleware/adminAuthMiddleware.js). Non-admin JWT tokens or cookies return `403 Forbidden: Administrative privileges required`.

---

## 3. Persistence Across Process Restarts & Page Reloads

- **Backend Restart:** The backend Node.js process was restarted while records were resident in MongoDB Atlas. Following restart, all candidate, company, job, and application documents were queried and returned identical state.
- **Frontend Reload:** Pages were hard-reloaded (`Ctrl+F5`) across `/candidate/profile`, `/app/jobs`, `/app/calendar`, and `/admin/overview`. All components rehydrated cleanly with data from the Atlas replica set.
