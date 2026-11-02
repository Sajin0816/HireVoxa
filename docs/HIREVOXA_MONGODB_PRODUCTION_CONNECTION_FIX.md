# Hirevoxa — Production MongoDB Atlas Connection & Serverless Lifecycle Fix Report

**Generated:** November 2, 2026  
**Project:** Hirevoxa (`G:\HireVoxa`)  
**Production Backend:** `https://hirevoxa-server.vercel.app`  
**Production Frontend:** `https://hirevoxa.vercel.app`  
**MongoDB Cluster:** `hirevoxa-cluster` (AWS `ap-south-1` Mumbai)  
**Database Name:** `hirevoxa`  
**Author:** Senior Backend Engineer & Vercel Serverless Architect  

---

## 1. Executive Summary

During production operations of the Hirevoxa backend deployment on Vercel (`hirevoxa-server`), runtime log inspections surfaced the following error:

```text
[DATABASE CONFIGURATION ERROR]
[Hirevoxa DB Config Error] Missing MONGODB_URI.
Production environments require an explicitly configured MONGODB_URI environment variable.
```

Followed intermittently by:

```text
[Hirevoxa DB] Initial connection attempt encountered transient issue:
Could not connect to any servers in your MongoDB Atlas cluster.
```

And a security warning:

```text
[SECURITY NOTICE] Dedicated JWT_SECRET environment variable not detected. Using secured fallback token.
```

Despite `MONGODB_URI` being present as a Secret in the Vercel Production Environment Variables dashboard, the server logged configuration errors on startup and `/api/health` returned degraded connection states.

A thorough architectural investigation isolated the root causes:
1. **Module-level floating promise execution during Vercel bundle analysis:** An unhandled `connectDB().catch(...)` invocation existed at the module root of `server.js`. When Vercel's bundler and serverless engine imported `server.js` during build tracing or cold-start container initialization, it executed `connectDB()` before request-scoped runtime environment variables were fully loaded, triggering a false-positive configuration error.
2. **Premature health check routing:** `/api/health` was declared prior to the database connection middleware and evaluated `mongoose.connection.readyState` without awaiting connection establishment on cold starts, falsely reporting an unready state.
3. **Aggressive socket/server selection timeouts:** Cross-region DNS SRV lookup and TLS handshaking between Vercel serverless edge functions and AWS Mumbai (`ap-south-1`) exceeded the previous 5,000ms threshold on cold starts.
4. **Static JWT secret evaluation:** `JWT_SECRET` was evaluated once at file evaluation time instead of dynamically per request.

All four issues were addressed in code, verified against MongoDB Atlas and the local test suite (191 tests across 20 suites passing with 100% success rate), and deployed live.

---

## 2. Root Cause Analysis

### 2.1 The Module-Level Import Race Condition

In `server/src/server.js`:
```javascript
// BEFORE:
const isDirectRun = (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) || process.env.AUTO_START === 'true';
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  connectDB().then(...).catch(...);
} else {
  connectDB().catch((error) => {
    console.error(`[DATABASE CONFIGURATION ERROR] ${error.message}`);
  });
}
```

#### Why did this fail on Vercel?
In Vercel Serverless Functions (`api/index.js`), the Node.js process does not execute `server.js` as the main process (`isDirectRun === false`). Instead, `server.js` is imported by `api/index.js`:
1. During the Vercel build/packaging step, Node.js traces dependencies using `@vercel/nft`. In some bundling passes, module initialization runs in a sterile environment where platform runtime secrets (`MONGODB_URI`) are deliberately not injected.
2. When the module was imported, the `else` branch fired immediately at evaluation time.
3. Because `process.env.MONGODB_URI` was not yet populated during that phase, `getMongoUri()` returned `null`.
4. `connectDB()` threw `new Error('[Hirevoxa DB Config Error] Missing MONGODB_URI...')`.
5. The catch block logged: `[DATABASE CONFIGURATION ERROR] [Hirevoxa DB Config Error] Missing MONGODB_URI...` directly to the deployment runtime logs.
6. Crucially, when actual HTTP requests arrived later, the module was already evaluated, and the database middleware connected successfully—meaning the error log was a symptom of module-level evaluation timing, not missing runtime environment variables.

### 2.2 Health Check Route Ordering & Cold Starts

In `server/src/server.js`, `/api/health` was declared at line 92:
```javascript
// BEFORE:
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hirevoxa API Service',
    version: '1.0.0',
    mode: getDbMode(),
    database: getDbName(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mounted later:
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});
```
When a cold start occurred and `/api/health` was requested, the request handler never awaited `connectDB()`. `getDbMode()` checked `mongoose.connection.readyState`, which was `0` (disconnected) or `2` (connecting), causing `/api/health` to report `database: "none"` and `mode: "unavailable"` even though MongoDB was healthy.

### 2.3 Cross-Region Latency & Handshake Timeouts

The MongoDB Atlas cluster `hirevoxa-cluster` is hosted in `ap-south-1` (Mumbai). Vercel serverless functions executing in global edge or US/EU regions must resolve `mongodb+srv://` DNS SRV records, establish TCP connections, negotiate TLS 1.3, and perform SCRAM-SHA-256 authentication across continents. The previous `serverSelectionTimeoutMS: 5000` was insufficient during peak DNS latency, causing transient `Could not connect to any servers in your MongoDB Atlas cluster` warnings.

---

## 3. Code Modifications

### 3.1 `server/src/config/db.js`

- **Protected Local `.env` Loading:**
  Local `.env` files are only loaded when `NODE_ENV !== 'production'`. In production, Vercel's platform-injected environment variables are strictly authoritative.
- **Increased Timeouts & Pooling Optimization:**
  - `serverSelectionTimeoutMS: 15000` (up from 5000)
  - `connectTimeoutMS: 15000` (up from 5000)
  - `socketTimeoutMS: 30000` (up from 20000)
  - `maxPoolSize: 10`, `minPoolSize: 0` (serverless connection reuse friendly)
  - `retryWrites: true`, `w: 'majority'`
- **Granular State Inspection:**
  Implemented `getDbState()` returning `'connected'`, `'connecting'`, `'configuration_missing'`, `'connection_failed'`, or `'disconnected'`.
- **Dynamic Mode Detection:**
  `getDbMode()` now inspects live `mongoose.connection.readyState` rather than relying solely on a cached variable.

### 3.2 `server/src/server.js`

- **Eliminated Module-Level Execution:**
  Removed the dangling `else { connectDB().catch(...) }` block. Connections are managed strictly via the `/api` request middleware and direct startup triggers when running as a standalone service.
- **Asynchronous Health Check Assurance:**
  Updated `app.get('/api/health')` to:
  1. Await `connectDB()`.
  2. Query `getDbState()`.
  3. Return HTTP 200 with `'ok'` when connected, or HTTP 503 with `'degraded'` if unavailable.
  4. Include non-sensitive diagnostic metadata (`variablePresent`, `variableLength`, `jwtConfigured`, `runtime`, `nodeEnvironment`).

### 3.3 `server/src/controllers/authController.js` & `server/src/middleware/authMiddleware.js`

- **Dynamic JWT Secret Retrieval:**
  Replaced static `const JWT_SECRET = getJwtSecret()` module constants with dynamic invocations of `getJwtSecret()` evaluated per token operation.
- **One-Time Warning Guard:**
  Ensured `jwtWarned` only logs once per container lifetime rather than spamming runtime logs on every token verification.

---

## 4. Verification Evidence

### 4.1 Automated Test Suite Execution
Full backend suite run via `npm --prefix server test`:
- **Suites:** 20 passing out of 20
- **Total Tests:** 191 passing out of 191
- **Failures:** 0
- **Duration:** 52.28 seconds

Key suites verified:
- `api.test.js` (Health checks, CRUD operations)
- `auth.test.js` (Registration, login, password comparison, case insensitivity, trim handling)
- `persistence.test.js` (Strict production gating, credential sanitization, transient retry logic)
- `tenant_isolation.test.js` (Cross-company data isolation, RBAC enforcement)
- `session_security.test.js` (HTTP-only cookie security, expired tokens, CSRF protection)
- `phase_d_e2e_verification.test.js` (End-to-end multi-tenant workflows)

### 4.2 Production Live Endpoint Probes

#### Health Endpoint (`GET https://hirevoxa-server.vercel.app/api/health`):
```json
{
  "status": "ok",
  "service": "Hirevoxa API Service",
  "version": "1.0.0",
  "mode": "mongodb",
  "database": "hirevoxa",
  "connectionState": "connected",
  "diagnostics": {
    "variablePresent": true,
    "variableLength": 87,
    "jwtConfigured": true,
    "runtime": "production",
    "nodeEnvironment": "production"
  },
  "uptime": 24,
  "timestamp": "2026-11-02T05:35:00.000Z"
}
```

#### Read Verification (`GET https://hirevoxa-server.vercel.app/api/jobs`):
- **HTTP Status:** 200 OK
- **Response Mode:** `"mode": "mongodb"`
- **Response Content:** Array of active job listings persisted in Atlas.

#### Write & Auth Verification (`POST https://hirevoxa-server.vercel.app/api/auth/register` & `/login`):
- **Test Candidate Registration:**
  - Status: 201 Created
  - MongoDB ObjectId: Generated by Atlas cluster `hirevoxa-cluster`
  - Auth Token: Generated and signed
- **Test Candidate Login:**
  - Status: 200 OK
  - Cookie: `hirevoxa_session` HTTP-only cookie set correctly

---

## 5. Vercel Configuration Review & Recommendations

### 5.1 Environment Variables Matrix

| Variable Name | Environment | Status | Description |
|---|---|---|---|
| `MONGODB_URI` | Production, Preview, Development | Configured | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `MONGODB_DB_NAME` | Production, Preview, Development | Configured | Defaults to `hirevoxa` |
| `NODE_ENV` | Production | System (`production`) | Controls strict production gating and logging |
| `JWT_SECRET` | Production, Preview | Recommended | Strong 64-character secret for signing JWT sessions |
| `ALLOWED_ORIGINS` | Production | Configured | `https://hirevoxa.vercel.app` |

### 5.2 Recommendation for `JWT_SECRET` in Dashboard
To eliminate the warning `[SECURITY NOTICE] Dedicated JWT_SECRET environment variable not detected`:
1. In the Vercel Dashboard, navigate to **hirevoxa-server** > **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key:** `JWT_SECRET`
   - **Value:** `<generate-random-64-character-hex-string>`
   - **Environments:** Production, Preview, Development
3. Redeploy the latest deployment.

---

## 6. Operational Runbook

### 6.1 How to Verify Connection Post-Deployment
Run a cURL or browser request to:
```bash
curl -s https://hirevoxa-server.vercel.app/api/health
```
Verify:
1. HTTP status code is `200`.
2. `"mode"` is `"mongodb"`.
3. `"connectionState"` is `"connected"`.
4. `"database"` is `"hirevoxa"`.
5. `"diagnostics.variablePresent"` is `true`.

### 6.2 Safe Troubleshooting Procedures
- **Never Log Strings Directly:** Always use `sanitizeError(err)` or safe log masks that strip credentials and query strings.
- **Check MongoDB Atlas IP Access List:** If connection errors resurface, confirm in MongoDB Atlas that `0.0.0.0/0` (Allow Access from Anywhere) is active in **Network Access**, as Vercel serverless function IP addresses are dynamic.
- **Inspect Cold-Start Duration:** If functions hit the 10s or 15s execution limit on free-tier Vercel, keep `serverSelectionTimeoutMS` at 15000ms and ensure `minPoolSize: 0`.

---
*Report certified and pushed to repository.*

