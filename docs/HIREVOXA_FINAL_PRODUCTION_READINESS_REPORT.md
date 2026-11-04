# HIREVOXA — PREVIEW ISOLATION HARDENING & PRE-DEPLOYMENT READINESS REPORT

**Date:** November 4, 2026  
**Repository:** `G:\HireVoxa`  
**GitHub Remote:** `https://github.com/Sajin0816/HireVoxa`  
**Current Working Branch:** `verify/final-pre-production-confirmation`  
**Role:** Principal DevOps Engineer, Backend Security Architect, and Senior Full-Stack Engineer  
**Status:** Local Hardening Completed — Ready for Branch Push & Vercel Preview Configuration

---

## 1. EXECUTIVE SUMMARY & VERDICT

To eliminate any risk of cross-contamination between Vercel Preview environments and the Production database, fail-closed protection has been implemented across both the frontend and backend architectures.

The codebase now enforces deterministic, fail-closed isolation:
1. **Frontend:** In any Vercel Preview deployment (`*.vercel.app` excluding canonical `hirevoxa.vercel.app`), the client requires an explicit, HTTPS-secured `VITE_API_BASE_URL` pointing to an isolated Preview backend. Falling back to the Production backend or localhost is strictly blocked. If the variable is missing or invalid, an accessible diagnostic overlay is rendered and all API requests are rejected upfront.
2. **Backend:** In any Vercel Preview deployment (`VERCEL_ENV === 'preview'`), the backend strictly requires `MONGODB_DB_NAME=hirevoxa_qa`. Falling back to the Production database `hirevoxa` is strictly prohibited and rejected at startup. Connection to `hirevoxa` is rejected with an isolation error, and in-memory demo mode is disabled in Preview.
3. **Production Preservation:** The production application running on `hirevoxa.vercel.app` and `hirevoxa-server.vercel.app` continues using its existing, verified configuration without modification. Local development continues to work without disruption.
4. **Verification Gate:** 222 automated tests (including 18 new isolation tests) passed across 24 suites. Client build compiled cleanly in 8.68s with 0 errors.

```text
========================================================================================
CURRENT ARCHITECTURAL STATUS:
FAIL-CLOSED PREVIEW ISOLATION IMPLEMENTED & TESTED (LOCAL)
PREVIEW ENVIRONMENT VARIABLES PENDING IN VERCEL DASHBOARD
========================================================================================
```

---

## 2. EXACT FILES CHANGED & TECHNICAL RATIONALE

| File Path | Nature of Change | Architectural Purpose |
| :--- | :--- | :--- |
| **`client/src/services/apiConfig.js`** | New Module | Pure isolation guard. Implements `isVercelPreviewHostname`, `isFrontendPreview`, `validatePreviewApiUrl`, and `resolveApiBaseUrl`. Detects Preview domains, validates HTTPS protocol, blocks pointing Preview to Production, and throws fail-closed errors. |
| **`client/src/services/api.js`** | Modified | Integrates `resolveApiBaseUrl`. Tracks `apiConfigError` at module initialization and rejects all API dispatches (`request`, `downloadResume`, `exportAdminReportCsv`, `exportBillingCsv`) if configuration is invalid. |
| **`client/src/App.jsx`** | Modified | Renders an accessible diagnostic screen if `getApiConfigurationError()` is non-null, guiding the operator on exact Vercel dashboard environment variable requirements. |
| **`client/vite.config.js`** | Modified | Injects `import.meta.env.VITE_VERCEL_ENV` from `process.env.VERCEL_ENV` at build time so Vite bundles have compile-time visibility into the Vercel deployment tier. |
| **`server/src/config/db.js`** | Modified | Implements `isPreviewDeployment()`, `resolveDbName()`, and `isDemoModeAllowed()`. In Preview, enforces `MONGODB_DB_NAME=hirevoxa_qa`, rejects missing DB names, rejects `hirevoxa`, rejects demo mode, and verifies connected DB post-connection. |
| **`server/src/server.js`** | Modified | Imports isolation helpers and enriches `/api/health` diagnostics with `dbNameConfigured` and `dbIsolationEnforced`. |
| **`server/package.json`** | Modified | Registers new test suites `tests/preview_isolation.test.js` and `tests/frontend_api_config.test.js` in `npm test` script. |
| **`server/tests/preview_isolation.test.js`** | New Test Suite (10 tests) | Proves backend Preview isolation: `hirevoxa_qa` resolution, missing DB rejection, `hirevoxa` rejection, missing URI rejection, demo mode prevention, production preservation, and local development compatibility. |
| **`server/tests/frontend_api_config.test.js`** | New Test Suite (8 tests) | Proves frontend Preview isolation: domain detection, missing variable fail-closed error, HTTP rejection, Production backend URL rejection, HTTPS normalization, production preservation, and local development compatibility. |
| **`docs/QA_PROGRESS.md`** | Modified | Appended Section 12 documenting the complete implementation, test results, and verification log. |

---

## 3. AUTOMATED TEST SUITE EXECUTION RESULTS

### Backend Test Runner (`npm --prefix server test`)
```text
TAP version 13
# tests 222
# suites 24
# pass 222
# fail 0
# cancelled 0
# skipped 0
# duration_ms 54840
```
- **Backend Preview Isolation Tests (`tests/preview_isolation.test.js`):** 10/10 PASS
- **Frontend API Config Tests (`tests/frontend_api_config.test.js`):** 8/8 PASS
- **Navigation & RBAC Tests (`tests/navigation_utils.test.js`):** 5/5 PASS
- **JWT Configuration Tests (`tests/jwt_config.test.js`):** 7/7 PASS
- **API & Core Routes Tests (`tests/api.test.js`):** 9/9 PASS
- **Authentication Tests (`tests/auth.test.js`):** 11/11 PASS
- **Session Security Tests (`tests/session_security.test.js`):** 9/9 PASS
- **Tenant Isolation Tests (`tests/tenant_isolation.test.js`):** 18/18 PASS
- **All other acceptance & lifecycle suites:** 145/145 PASS

### Frontend Quality & Build
- **Code Linter (`npm --prefix client run lint`):** 0 errors (112 non-blocking warnings).
- **Production Build (`npm --prefix client run build`):** Compiled 1,986 modules cleanly in 8.68s (`dist/index.html`, `dist/assets/index-lbQrKee3.css`, `dist/assets/index-BVVRX1Gb.js`). Zero build errors.

---

## 4. PREVIEW FAIL-CLOSED BEHAVIOR SPECIFICATION

### Frontend Behavior in Preview
1. **Domain Detection:** Any URL ending in `.vercel.app` (except `hirevoxa.vercel.app`) or any build with `VITE_VERCEL_ENV=preview` is treated as a Preview environment.
2. **Missing `VITE_API_BASE_URL`:**
   - Immediately throws: `[Hirevoxa Config Error] Preview deployment missing required VITE_API_BASE_URL. In Preview environments, an explicit HTTPS backend URL is required to prevent accidental calls to the Production API.`
   - Does NOT default to Production backend (`https://hirevoxa-server.vercel.app/api`).
   - Does NOT default to `localhost`.
   - UI renders a clear diagnostic overlay with setup instructions.
   - All `api.*` methods reject upfront before initiating any fetch request.
3. **Invalid Protocol (HTTP):**
   - Immediately throws: `[Hirevoxa Config Error] Invalid VITE_API_BASE_URL 'http://...'. Preview API URL must use secure HTTPS protocol.`
4. **Pointing to Production Backend:**
   - If `VITE_API_BASE_URL` contains `hirevoxa-server.vercel.app`, it is immediately rejected: `[Hirevoxa Config Error] Preview VITE_API_BASE_URL cannot point to the Production backend (https://hirevoxa-server.vercel.app). Preview environments must point to an isolated Preview backend.`

### Backend Behavior in Preview
1. **Environment Detection:** Any deployment where `VERCEL_ENV === 'preview'` or `APP_ENV === 'preview'`.
2. **Missing `MONGODB_DB_NAME`:**
   - Throws: `[Hirevoxa DB Isolation Error] Missing MONGODB_DB_NAME in Preview environment. Preview deployments require an explicitly configured database name (must be 'hirevoxa_qa'). Silently falling back to the production database is strictly prohibited.`
   - Serverless invocations fail closed; no connection is attempted.
3. **Production Database Rejection:**
   - If `MONGODB_DB_NAME === 'hirevoxa'`, throws: `[Hirevoxa DB Isolation Error] Resolved database in Preview environment is 'hirevoxa'. Connecting a Preview deployment to the production database is strictly prohibited.`
4. **Unauthorized Database Rejection:**
   - If `MONGODB_DB_NAME !== 'hirevoxa_qa'`, throws: `[Hirevoxa DB Isolation Error] Invalid MONGODB_DB_NAME '...' in Preview environment. Preview deployments are strictly restricted to 'hirevoxa_qa'.`
5. **Post-Connection Assertion:**
   - After Mongoose establishes a connection, verifies `conn.connection.name === 'hirevoxa_qa'`. If mismatched, immediately disconnects and terminates the process.

---

## 5. REQUIRED VERCEL DASHBOARD CONFIGURATION (MANUAL STEP)

Before pushing the verification branch to trigger Preview deployments, the following configuration must be set in the Vercel dashboard:

### Project 1: Backend (`hirevoxa-server`)
Go to: **Vercel Dashboard > `hirevoxa-server` > Settings > Environment Variables**

| Variable Name | Value | Target Environment Scope | Purpose |
| :--- | :--- | :---: | :--- |
| `MONGODB_DB_NAME` | `hirevoxa_qa` | **Preview ONLY** (Uncheck Production & Development) | Enforces isolated QA database for Preview |
| `MONGODB_URI` | *(Your existing Atlas connection string)* | **Preview** (Ensure checked) | Atlas cluster connectivity |
| `JWT_SECRET` | *(Your existing secret string)* | **Preview** (Ensure checked) | Secure session tokens |

### Project 2: Frontend (`hirevoxa`)
Go to: **Vercel Dashboard > `hirevoxa` > Settings > Environment Variables**

| Variable Name | Value | Target Environment Scope | Purpose |
| :--- | :--- | :---: | :--- |
| `VITE_API_BASE_URL` | `https://hirevoxa-server-git-<branch>-himmatchouhan50-6334.vercel.app/api` | **Preview ONLY** | Points Preview frontend to Preview backend |

### Deployment Protection Note
In **Vercel Dashboard > Project Settings > Deployment Protection**:
- Preview URLs currently redirect to `Login – Vercel`. For automated end-to-end testing, temporarily disable Vercel Authentication for Preview deployments, or provide a protection bypass token (`x-vercel-protection-bypass`).

---

## 6. REMOTE SYNCHRONIZATION & PREVIEW DEPLOYMENT EVIDENCE

- **Current Git Branch:** `verify/final-pre-production-confirmation` (tracked at `origin/verify/final-pre-production-confirmation`)
- **Deployed Commit:** `95cf9db` (`feat(security): implement fail-closed preview isolation for database and api`)
- **Remote Push Status:** Pushed and synchronized with GitHub.
- **Vercel Deployments Generated:**
  - **Frontend SPA (`hirevoxa`):** Deployment `AkKnNCBrpGonzNNV9Su4S7xdBMg9` (`https://hirevoxa-git-verify-final-pre-produ-4da658-himmatchouhan50-6334.vercel.app`) — State: `success`.
  - **Backend API (`hirevoxa-server`):** Deployment `CHt3HBtvtx5mTYwFYKNmngLhv4m5` (Inspect: `https://vercel.com/himmatchouhan50-6334/hirevoxa-server/CHt3HBtvtx5mTYwFYKNmngLhv4m5`) — State: `success`.
- **Production Status:** Untouched, operational, healthy (`https://hirevoxa-server.vercel.app/api/health` reports connected to `hirevoxa`).

---

## 7. REMAINING PREVIEW VERIFICATION & PRODUCTION RELEASE GATE

1. **Backend Preview URL & Environment Validation:**
   - Confirm backend preview URL from deployment overview (`CHt3HBtvtx5mTYwFYKNmngLhv4m5`).
   - Query `/api/health` with bypass token or active session to verify `database: "hirevoxa_qa"`, `connectionState: "connected"`, and `dbIsolationEnforced: true`.
2. **Frontend Preview API Binding:**
   - Configure `VITE_API_BASE_URL` in Vercel (`hirevoxa` project > Settings > Environment Variables > Preview scope) with the verified backend Preview URL.
   - Trigger frontend preview redeploy.
3. **End-to-End Browser QA:**
   - Verify Employer & Candidate authentication, job lifecycle, applications, interviews, and messaging on the deployed Preview.
4. **Production Release Gate:**
   - Fast-forward merge `verify/final-pre-production-confirmation` into `main` only after explicit user authorization (`"GO PRODUCTION"`).

### Absolute Stop Condition
- **NO PRODUCTION DEPLOYMENT TRIGGERED.**
- **NO MERGE INTO MAIN EXECUTED.**
- **NO PRODUCTION DATABASE WRITES EXECUTED.**
- **Awaiting User Review and Instructions.**
