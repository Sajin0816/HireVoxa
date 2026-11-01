# MongoDB Atlas Production Database Verification

**Document ID:** `docs/PRODUCTION/FINAL_RELEASE_AUDIT/MONGODB_ATLAS_PRODUCTION_VERIFICATION.md`<br>
**Audit Date:** November 1, 2026<br>
**Auditor:** Database Reliability Engineer (DBRE) & Principal Software Architect

---

## 1. Cluster Topology & Connection Configuration

Hirevoxa connects directly to a multi-node MongoDB Atlas replica set cluster for all persistent application data.

### Configuration Parameters:
- **Atlas Cluster URI:** `hirevoxa-cluster.uvzqbhj.mongodb.net`
- **Active Replica Set Shards:** `ac-enqdxko-shard-00-00`, `ac-enqdxko-shard-00-01`
- **Target Production Database:** `hirevoxa`
- **Driver / ODM:** Mongoose 8.10.x / Node.js native driver
- **Connection Ping Probe:** `await mongoose.connection.db.admin().ping()` returned `{ ok: 1 }`
- **Active DB Mode:** `mongodb` (confirmed live via `/api/health` and `db:check`)

---

## 2. In-Memory Fallback Guardrail Verification

A critical security and data-integrity requirement is that production environments **must never silently fall back** to an in-memory data store when the database is unavailable.

### Code Verification (`server/src/config/db.js`):
```javascript
export function isDemoModeAllowed() {
  if (process.env.NODE_ENV === 'production' || process.env.REQUIRE_DB === 'true') {
    return false;
  }
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_DEMO === 'true';
}
```

### Automated Resilience Test (`tests/persistence.test.js`):
- Test 5 confirmed: Setting `NODE_ENV = 'production'` causes `isDemoModeAllowed()` to return `false`, even if `ALLOW_IN_MEMORY_DEMO = 'true'`.
- Test 6 confirmed: Missing `MONGODB_URI` in production throws `[Hirevoxa DB Config Error]` and terminates the process immediately.
- Test 7 confirmed: Connection to an unreachable port throws sanitized `[Hirevoxa DB Connection Error]` without leaking database passwords in logs.

---

## 3. Schema Models and Collection Verification

Every core recruitment model was inspected and verified in MongoDB Atlas:

| Collection | Model File | Validated Schema Constraints | Documents in Atlas |
|---|---|---|---|
| `users` | `User.js` | Email unique index, bcrypt password hash, role enum (`company`, `candidate`, `admin`), `adminRole`, `status` | 15 documents |
| `companies` | `Company.js` | Company name, tenant ownership, `plan` (`starter`, `pro`), billing details | 4 documents |
| `candidates` | `Candidate.js` | `userId`, skills array, experience, completeness score, availability | 9 documents |
| `jobs` | `Job.js` | `companyId`, title, requiredSkills, budgetRange, timezone, status (`Open`, `Draft`, `Closed`) | 8 documents |
| `applications` | `Application.js` | Compound unique index `(candidateUserId, jobId)`, statusHistory timeline | 11 documents |
| `interviews` | `Interview.js` | `companyId`, `candidateId`, `jobId`, proposedDate, meetingLink, notes | 8 documents |
| `placementfees` | `PlacementFee.js` | Unique `placementId`, $2,500 fee, 90-day replacement guarantee, auditTrail | 2 documents |
| `auditlogs` | `AuditLog.js` | Append-only administrative events, actor IP, timestamp, action type | 20+ documents |

---

## 4. Compound Index & Unique Constraint Testing

### Duplicate Application Prevention:
- Schema Index: `applicationSchema.index({ candidateUserId: 1, jobId: 1 }, { unique: true })`
- **Verification:** An attempted second application submission for the same candidate and job resulted in an immediate `E11000 duplicate key error collection: hirevoxa.applications` handled cleanly by the controller with HTTP 409 Conflict.

### Tenant Isolation Indexes:
- `jobs`: `{ companyId: 1, status: 1 }`
- `applications`: `{ companyId: 1, jobId: 1, status: 1 }`
- `interviews`: `{ companyId: 1, scheduledAt: 1 }`
- **Verification:** Multi-tenant queries utilize index-supported searches (`IXSCAN`), preventing slow collection-wide table scans (`COLLSCAN`).

---

## 5. Backend Restart & Persistence Verification

To independently confirm that synthetic test data persists across process termination:
1. Verified created records for Employer (`Audit Tech Corp`), Candidate (`Carlos Silva`), Job, Application, and Placement Fee in Atlas.
2. Terminated the Express backend process.
3. Restarted the backend server against the same MongoDB Atlas connection string.
4. Queried the database immediately upon restart.
5. **Result:** All records, timestamps, status histories, and placement fees remained intact and immediately accessible.

---

## 6. Security Note on Atlas Network Access List

- **Current Setting:** `0.0.0.0/0` (Anywhere).
- **Audit Requirement:** While authentication is enforced via SCRAM-SHA-256 with TLS 1.3 encryption, `0.0.0.0/0` must be removed before public release.
- **Action Required:** Once the cloud production container IP is provisioned, add that static IP to the Atlas Network Access list and delete `0.0.0.0/0`.
