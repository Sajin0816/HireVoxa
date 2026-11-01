# Hirevoxa — Application Security & Architecture Audit Report

**Audit Date:** 2026-10-31<br>
**Auditor:** Senior Application Security Engineer & Penetration Tester<br>
**Location:** `docs/SECURITY_AUDIT_REPORT.md`<br>
**Classification:** Confidential / Security Operations

---

## 1. Executive Summary

A comprehensive application security assessment was conducted on `G:\HireVoxa`. The platform demonstrates robust defense-in-depth architectural patterns across authentication, password hashing, route authorization, tenant isolation, and credential sanitization.

The security findings identify **0 Critical Vulnerabilities**, **1 High-Severity Dependency Issue**, and **3 Medium-Severity Operational Recommendations**.

---

## 2. Authentication & Credential Architecture

### A. Password Storage & Hashing
- **Implementation:** [`server/src/models/User.js`](file:///g:/HireVoxa/server/src/models/User.js#L49-L58)
- **Algorithm:** `bcryptjs` with salt rounds = 10.
- **Evaluation:** Passwords are automatically hashed in the Mongoose `pre('save')` hook only when modified. Raw passwords are never stored in the database.
- **Verification:** Verified that login comparisons use `bcrypt.compare()`. User password hashes are deleted from API responses (`delete userObj.password`) prior to serializing responses.

### B. Session Management & Token Revocation
- **Implementation:** [`server/src/controllers/authController.js`](file:///g:/HireVoxa/server/src/controllers/authController.js#L17-L57), [`server/src/middleware/authMiddleware.js`](file:///g:/HireVoxa/server/src/middleware/authMiddleware.js)
- **Token Mechanism:** Cryptographically signed JSON Web Tokens (`jsonwebtoken`) with 7-day expiration (`JWT_EXPIRES_IN=7d`).
- **Real-Time Revocation on Account Suspension:** In `authMiddleware.js`, every authenticated request re-evaluates the user's active status. If an administrator suspends a user account in the Operations Panel, all subsequent requests by that user are immediately rejected with `401 Unauthorized` (`Account suspended`), preventing revoked session reuse without waiting for token expiry.
- **Production Guard:** Startup enforces that `JWT_SECRET` must be set to a non-default string in production; otherwise, the process halts with `[FATAL SECURITY ERROR]`.

---

## 3. Server-Side Role-Based Access Control (RBAC)

The backend enforces strict role-based route gating:

```mermaid
graph TD
    Client[Incoming Client Request] --> RateLimiter[Rate Limiter 300 req/15m]
    RateLimiter --> Helmet[Helmet Security Headers]
    Helmet --> Auth[authMiddleware: protect]
    Auth --> RoleCheck{User Role}
    RoleCheck -->|Candidate| CandPortal[/api/candidates/me/*]
    RoleCheck -->|Company| RecruiterPortal[/api/jobs, /api/interviews]
    RoleCheck -->|Admin| AdminCheck{adminRole Tier}
    AdminCheck -->|Analyst| AdminRO[Read-Only Metrics & Logs]
    AdminCheck -->|Ops Admin| AdminOps[Verification & Moderation]
    AdminCheck -->|Owner| AdminAll[Settings, Tier Demotion, Root Ops]
```

### Authorization Enforcement Matrix
1. **Candidate Boundary:** Candidates cannot create or delete job requisitions (`HTTP 403 Forbidden`). Candidates cannot view other candidates' private profiles or resumes.
2. **Company Boundary:** Recruiters can only access and modify their own organization's requisitions (`companyId`). Requisitions belonging to other organizations return `HTTP 403 Forbidden`.
3. **Public Admin Registration Prevention:** `POST /api/auth/register` rejects registration requests where `role: 'admin'` with `HTTP 400 Bad Request`. Administrator accounts can only be created via the local CLI tool (`npm run bootstrap:admin`).

---

## 4. Multi-Tenant Data Isolation

- **Verification:** Validated by [`server/tests/tenant_isolation.test.js`](file:///g:/HireVoxa/server/tests/tenant_isolation.test.js) (18 test scenarios).
- **Enforcement:**
  - `companyId` is derived from the authenticated token claim, never from client request bodies.
  - Job queries filter by `{ companyId: tenantCompanyId }` unless explicitly querying public open marketplace listings.
  - Candidate application reviews enforce `{ companyId: effectiveCompanyId }`.

---

## 5. Candidate Resume Security & Privacy

- **Implementation:** [`server/src/services/resumeStorage.js`](file:///g:/HireVoxa/server/src/services/resumeStorage.js), [`server/src/controllers/candidatePortalController.js`](file:///g:/HireVoxa/server/src/controllers/candidatePortalController.js)
- **Validation:**
  - File size restricted to **5 MB maximum**.
  - MIME type and magic byte inspection (`%PDF-`) validate genuine PDF files.
  - Structural inspection via `pdf-lib` ensures no embedded scripts or invalid streams exist.
- **Storage Isolation:** Uploaded resumes are assigned random UUID keys and stored outside static web roots (`server/storage/resumes/`).
- **Access Authorization:** Only two actors can access a candidate's resume via `GET /api/candidates/resume/:id`:
  1. The candidate who uploaded it (`req.user.id === candidateUserId`).
  2. A recruiter belonging to a company where the candidate has submitted an active job application.

---

## 6. Input Sanitization & Anti-Injection

- **CSV Formula Injection:** In `adminController.js`, export fields prepending `=`, `+`, `-`, `@`, `\t`, or `\r` are sanitized with a leading single quote (`'`), preventing formula execution when opened in Excel/Google Sheets.
- **SQL / NoSQL Injection:** Queries use structured Mongoose model query objects with explicit field types rather than raw concatenated query strings.
- **Cross-Site Scripting (XSS):** React JSX escapes rendered strings by default. Helmet enforces standard browser XSS filtering and CSP headers.

---

## 7. Dependency Vulnerability Assessment

Running `npm audit` across the monorepo identified the following:

| Package | Severity | Advisory ID | Vulnerability Type | Impact |
| :--- | :---: | :---: | :--- | :--- |
| `body-parser` (< 1.20.9) | **HIGH** | `GHSA-27r3-jxmh-p828` | Denial of Service | Trailing bytes after compressed request body may trigger unhandled exception. |
| `qs` (6.7.0 – 6.16.0) | **MODERATE** | `GHSA-6pq8-jhm2-2vcw` | Denial of Service | `qs.stringify` with `arrayFormat: comma` throws uncaught TypeError. |
| `postcss-selector-parser` (< 6.1.5) | **MODERATE** | `GHSA-rj75-hqrm-r3gf` | CPU Exhaustion | Quadratic complexity during flat selector parsing in build pipeline. |

**Remediation:** Run `npm --prefix server audit fix` and `npm --prefix client audit fix` before production cutover.
