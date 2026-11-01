# Hirevoxa — Quality Assurance & Testing Guide

**Document Version:** 2.0.0<br>
**Location:** `docs/TESTING.md`

---

## 1. Automated Test Suites Overview

Hirevoxa utilizes the native Node.js Test Runner (`node:test` and `node:assert/strict`) for rapid, dependency-free automated test execution.

### Test Execution Command
Run all test suites across the monorepo:
```bash
npm test
```
Or directly within the backend service:
```bash
npm --prefix server test
```

### Test Runner Configuration
Configured in [`server/package.json`](file:///g:/HireVoxa/server/package.json#L13):
```bash
node --import ./tests/setup.js --test tests/*.test.js
```
The setup hook ([`server/tests/setup.js`](file:///g:/HireVoxa/server/tests/setup.js)) initializes `process.env.NODE_ENV = 'test'` and `process.env.ALLOW_IN_MEMORY_DEMO = 'true'`, ensuring all test suites run in isolated memory fixtures without mutating remote database records.

---

## 2. Test Suite Breakdown (171 Tests across 19 Suites)

| Suite File | Scope & Covered Behaviors |
| :--- | :--- |
| `tests/api.test.js` | REST endpoint routing, health checks, candidate listings, job listings, deterministic matching algorithm verification. |
| `tests/auth.test.js` | User registration, login, JWT generation, password hashing, invalid credentials rejection, logout cookie clearing. |
| `tests/security.test.js` | Route protection, spoofed sender/company ID rejection, unauthenticated mutation blockage, rate limiting. |
| `tests/phase2a_acceptance.test.js` | Acceptance test scenarios for role enforcement, session restoration, and CSRF protection headers. |
| `tests/phase2a_e2e_qa.test.js` | End-to-end user journeys for both company and candidate accounts. |
| `tests/tenant_isolation.test.js` | Multi-tenant isolation: ensures Company A cannot view, update, or delete Company B's jobs, interviews, or candidates. |
| `tests/session_security.test.js` | HttpOnly cookie verification, SameSite policy enforcement, session expiry, token refresh. |
| `tests/persistence.test.js` | Mongoose schema paths, indexes, credential masking sanitization, production startup fail-fast gates. |
| `tests/phase3_candidate_portal.test.js` | Candidate profile completeness scoring, whitelist field validation, private PDF resume validation, 5MB file limits. |
| `tests/phase3_e2e_scenario.test.js` | Full 16-step candidate journey from registration to profile completion, resume upload, and job search. |
| `tests/phase4_hiring_workflow.test.js` | 8-stage application lifecycle state machine, interview scheduling, in-app notifications, candidate withdrawal. |
| `tests/phase4_5_admin_operations.test.js` | 3-tier admin RBAC (`owner`, `ops_admin`, `analyst`), account suspension with real-time JWT revocation, company verification, job moderation, CSV formula injection neutralization. |
| `tests/phase5_monetization.test.js` | Starter pilot limits (5 jobs), Pro subscription upgrades (50 jobs, CSV exports), placement billing ($2,500), webhook idempotency, webhook signature validation. |

---

## 3. Frontend Build & Quality Checks

### Production Client Bundle Build
Validates Vite bundler, React JSX compilation, and asset resolution:
```bash
npm --prefix client run build
```

### Static Analysis & Linting
Runs oxlint across all frontend files:
```bash
npm --prefix client run lint
```

---

## 4. Live Database Connectivity Check

To run live database diagnostics against MongoDB Atlas without starting the full Express server:
```bash
npm --prefix server run db:check
```
Expected output:
```text
[Hirevoxa DB Check] Operating mode: mongodb
[Hirevoxa DB Check] Ping successful: { ok: 1 }
[Hirevoxa DB Check] Active database: hirevoxa
```
