# HIREVOXA — FINAL QA DEFECTS LOG & REPAIR REGISTER
**Document Version:** 1.0.0<br>
**Audit Date:** 2026-10-29<br>
**Target:** Live Website E2E QA Audit & Fix Cycle

---

## 1. DEFECT REGISTER & RESOLUTIONS

### DEF-01: Transient TLS Handshake Alert on Cloud Atlas
- **Severity:** Medium
- **Component:** `server/src/config/db.js`
- **Reproduction Steps:**
  1. Open multiple rapid connections to MongoDB Atlas via Node 22 on Windows.
  2. Observe OpenSSL alert: `tlsv1 alert internal error (SSL alert number 80)`.
- **Root Cause:**
  Node 22 upgraded to OpenSSL 3.x, which occasionally resets TLS 1.3 session handshakes against shared cloud Atlas endpoints when connections are opened and terminated in rapid succession from the same client IP.
- **Fix Applied:**
  Implemented resilient connection retry logic in `server/src/config/db.js` with up to 3 connection attempts separated by a 2,000ms backoff before failing.
- **Regression Evidence:**
  Executed multiple consecutive connection tests (`npm run db:check`); all succeeded with `{ ok: 1 }` without failing.

---

### DEF-02: SRV DNS Resolution Failure when `family: 4` Applied
- **Severity:** Low
- **Component:** `server/src/config/db.js`
- **Reproduction Steps:**
  1. Configure `family: 4` in Mongoose connection options with a `mongodb+srv://` URI.
  2. Attempt to resolve Atlas cluster host.
- **Root Cause:**
  The `mongodb+srv://` protocol performs a DNS SRV record query to discover cluster shard hostnames. Enforcing `family: 4` at the socket level restricts Node's SRV resolver and causes DNS lookup timeouts.
- **Fix Applied:**
  Removed the `family: 4` option from `mongoose.connect()`, allowing standard DNS SRV resolution to operate as intended by the MongoDB driver.
- **Regression Evidence:**
  Mongoose cleanly resolves all cluster shard hosts (`ac-enqdxko-shard-00-*.uvzqbhj.mongodb.net`).

---

### DEF-03: Automated Test Suite Attempting to Connect to Cloud Atlas
- **Severity:** Medium
- **Component:** `server/src/config/db.js`
- **Reproduction Steps:**
  1. Populate `server/.env` with `MONGODB_URI`.
  2. Run `npm test`.
  3. Observe unit tests trying to query remote MongoDB Atlas rather than using isolated test fixtures.
- **Root Cause:**
  `db.js` imported `.env` globally and evaluated `process.env.MONGODB_URI` without verifying whether `process.env.NODE_ENV === 'test'`.
- **Fix Applied:**
  Added a test environment guard in `connectDB()`:
  ```javascript
  if (process.env.NODE_ENV === 'test' && !overrideUri && process.env.TEST_WITH_LIVE_DB !== 'true') {
    activeDbMode = 'in-memory-demo';
    return;
  }
  ```
- **Regression Evidence:**
  `npm test` runs all 156 tests in isolated in-memory fixture mode in 39s–53s, while normal server startup (`node src/server.js`) connects directly to MongoDB Atlas.

---

### DEF-04: Lack of Dedicated Script for Operator DB Diagnostics
- **Severity:** Low
- **Component:** `server/package.json`
- **Reproduction Steps:**
  1. An operator needs to quickly verify Atlas cluster ping without starting the entire Express HTTP server.
  2. No standalone npm command existed for this purpose.
- **Fix Applied:**
  Created `server/src/scripts/verifyConnection.js` and registered `"db:check": "node src/scripts/verifyConnection.js"` in `server/package.json`.
- **Regression Evidence:**
  Running `npm run db:check` prints connection status, cluster host, and `{ ok: 1 }` ping response in < 3 seconds.

---

## 2. UNRESOLVED DEFECTS SUMMARY
- **Critical Severity:** 0
- **High Severity:** 0
- **Medium Severity:** 0
- **Low Severity:** 0

All identified defects have been analyzed, repaired with minimal scoped modifications, and verified with passing regression tests.
