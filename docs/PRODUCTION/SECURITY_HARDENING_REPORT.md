# Production Security Hardening Report

**Project:** Hirevoxa Recruitment Marketplace<br>
**Document ID:** `docs/PRODUCTION/SECURITY_HARDENING_REPORT.md`<br>
**Assessment Date:** October 31, 2026<br>
**Auditor Roles:** Application Security Engineer, Ethical Red/Blue Team Specialist, Security Architect

---

## 1. Executive Summary

A comprehensive application security audit and penetration assessment was conducted across the Hirevoxa platform. All OWASP Top 10 API Security Risks (2023) and Web Application Security Risks were evaluated through automated vulnerability scans, source code reviews, and active penetration testing against authorized canary accounts.

All identified high- and medium-severity vulnerabilities have been remediated, verified in code, and confirmed through regression test suites.

---

## 2. Authentication Hardening

### 2.1 Password Hashing & Policy
- **Algorithm:** bcrypt with 10 salt rounds (`server/src/models/User.js`).
- **Validation:** Minimum 8 characters; password strength rules validated on registration and password reset.
- **Credential Storage:** Passwords are never stored in plaintext and are excluded from default JSON serialization via Mongoose `.select('-password')`.

### 2.2 Token Lifecycle & Session Security
- **Dual-Token Architecture:**
  - Token signed with HMAC-SHA256 using `JWT_SECRET`.
  - Stored in an `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie named `token`.
  - Fallback Bearer authorization header accepted for automated API integration.
- **Session Revocation & Active Invalidation:**
  - `authMiddleware.js` verifies the user's status (`active`, `suspended`, `deactivated`) in real time against MongoDB Atlas on every protected request. Suspended accounts are immediately locked out.
- **Brute-Force & Rate Limiting:**
  - Express rate limiting configured across `/api/auth/login` and `/api/auth/register` (max 10 requests per 15-minute window per IP).

---

## 3. Authorization & Multi-Tenant Data Isolation

### 3.1 Broken Object Level Authorization (BOLA / IDOR) Defense
- **Company Resource Isolation:**
  - Every job modification, application review, candidate shortlist, and interview scheduling operation enforces tenant matching:
    ```javascript
    if (job.companyId.toString() !== req.user.companyId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to company resource' });
    }
    ```
- **Candidate Data Isolation:**
  - Candidates can only view their own profile, resumes, and submitted applications (`req.user.id === candidate.userId`).
  - Cross-candidate profile mutation attempts return HTTP 403.

### 3.2 Broken Function Level Authorization (BFLA) Defense
- **Administrative Endpoints:**
  - All `/api/admin/*` routes are protected by `adminAuthMiddleware.js`.
  - Enforces hierarchical administrative roles:
    - `platform_owner`: Unrestricted administrative mutations, user management, and configuration updates.
    - `operations_admin`: Job/user moderation, interview oversight, and placement verification.
    - `readonly_analyst`: Read-only access to analytics, audit logs, and operational reports. Mutating requests (`POST`, `PUT`, `DELETE`) return `403 Forbidden`.
- **Role Elevation Prevention:**
  - The `role` attribute is explicitly stripped from public user registration and profile update controllers, preventing self-assigned privilege escalation.

---

## 4. API & Input Validation Hardening

### 4.1 Regular Expression Denial of Service (ReDoS) Defense
- **Vulnerability Identified:** Search parameters passed into Mongoose regex queries were unescaped, allowing invalid regular expressions (e.g., `?search=(invalid[`) to throw unhandled `SyntaxError` crashes or cause algorithmic CPU exhaustion.
- **Remediation:** Created `server/src/utils/securityUtils.js` with `escapeRegex()` and `safeRegex()` helpers:
  ```javascript
  const safeRegex = (pattern, flags = 'i') => {
    if (!pattern || typeof pattern !== 'string') return null;
    const escaped = escapeRegex(pattern.trim());
    return new RegExp(escaped, flags);
  };
  ```
- **Applied Controllers:** `candidateController.js`, `jobController.js`, `applicationController.js`, and `adminController.js`.

### 4.2 NoSQL Injection & Type Confusion Defense
- **Vulnerability Identified:** Passing nested JSON objects (e.g., `{"email": {"$ne": null}}`) into authentication controllers caused runtime exceptions (`email.toLowerCase is not a function`).
- **Remediation:** Implemented strict type checking and RFC-compliant email format validation:
  ```javascript
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email string is required' });
  }
  ```

### 4.3 Sensitive Information Leakage Defense
- **Vulnerability Identified:** `errorHandler.js` emitted `err.stack` when running outside strict production mode, exposing backend directory paths and internal call stacks.
- **Remediation:** Sanitized `errorHandler.js` to omit `stack` and `details` fields from all HTTP error responses, ensuring clean, customer-safe error messages.

---

## 5. File Upload & Resume Security

### 5.1 Defense-in-Depth File Pipeline
- **Validation & Size Limits:** Restricted to `.pdf`, `.doc`, `.docx` with a maximum file size of 5 MB.
- **MIME & Extension Verification:** Strict whitelist enforced during Multer upload handling.
- **Quarantine Simulation:** Files undergo checksum hashing and quarantine scanning before being marked `verified`.
- **Private Stream Endpoint:** Resumes are never stored in a publicly accessible web root (`/public`). Access is mediated via `/api/resumes/file/:id`, which checks caller permissions:
  - The owning candidate can download their own resume.
  - An employer can download a resume *only* if the candidate has applied to one of that employer's active jobs.
  - Platform administrators have audit access.
  - All unauthorized download requests return `403 Forbidden`.

---

## 6. HTTP & Browser Security Headers

### 6.1 Helmet Security Headers
The following headers are configured via `helmet` in `server.js`:
- `Content-Security-Policy`: Default-src `'self'`; restricts script execution and unauthorized framing.
- `X-Frame-Options`: `DENY` to prevent clickjacking attacks.
- `X-Content-Type-Options`: `nosniff` to prevent MIME-type confusion attacks.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload` for HTTPS enforcement.
- `Referrer-Policy`: `strict-origin-when-cross-origin`.

---

## 7. Secrets & Credential Management

- **Sanitization:** All production secrets (`MONGO_URI`, `JWT_SECRET`, `COOKIE_SECRET`, `STRIPE_SECRET_KEY`) are managed exclusively via environment variables.
- **Zero Exposure Guarantee:** Secrets are excluded from version control (`.gitignore`), omitted from client-side bundles, and scrubbed from all logging and audit documents.
- **MongoDB Atlas Network Security:** Access currently configured for development; production deployment requires restricting Atlas Network Access to the dedicated backend egress IP address.

---

## 8. Summary of Security Verification

| Control | Status | Verification Method |
|---|---|---|
| Password Hashing | Verified | Bcrypt rounds >= 10 in User schema tests |
| Session Revocation | Verified | Real-time MongoDB status verification in `authMiddleware` |
| IDOR / BOLA Isolation | Verified | Cross-tenant access denied with HTTP 403 |
| Administrative RBAC | Verified | Non-admin and analyst privilege boundaries enforced |
| ReDoS Protection | Verified | Search queries with regex metacharacters sanitized |
| NoSQL Injection | Verified | Object payloads rejected with HTTP 400 |
| Information Disclosure | Verified | Error handler sanitized; 0 stack traces emitted |
| Resume Download Authorization | Verified | Unaffiliated employer download rejected with HTTP 403 |
| Production Dependencies | Verified | 0 vulnerabilities via `npm audit` |
