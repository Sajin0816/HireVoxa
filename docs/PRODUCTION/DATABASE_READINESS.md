# MongoDB Atlas Production Readiness Report

**Project:** Hirevoxa Recruitment Marketplace<br>
**Document ID:** `docs/PRODUCTION/DATABASE_READINESS.md`<br>
**Assessment Date:** October 31, 2026<br>
**Auditor Roles:** Database Architect, Senior DevOps Engineer, Reliability Engineer

---

## 1. Database Architecture & Atlas Cluster Topology

Hirevoxa connects directly to a dedicated MongoDB Atlas replica set cluster for all persistent application data.

- **Cluster Host:** `hirevoxa-cluster.uvzqbhj.mongodb.net`
- **Target Database:** `hirevoxa`
- **Driver / ODM:** Mongoose (Node.js native driver)
- **Persistence Verification:** Confirmed live write, read, and delete operations against Atlas; in-memory fallback is strictly disabled in production mode.

---

## 2. Connection Pool & Performance Configuration

The database connection layer (`server/src/config/db.js`) is configured with production-grade pooling and retry policies:

```javascript
const options = {
  maxPoolSize: 50,              // High concurrent connection ceiling
  minPoolSize: 10,              // Pre-warmed idle connections
  serverSelectionTimeoutMS: 5000, // Fast failover timeout
  socketTimeoutMS: 45000,       // Prevent hanging sockets
  family: 4                     // Force IPv4 DNS resolution
};
```

### Connection Resilience & Health Probes
- `mongoose.connection.on('disconnected')`: Logs structured warning and automatically attempts reconnection.
- `mongoose.connection.on('error')`: Captures socket errors without crashing the Express process.
- Direct ping probe verified: `await mongoose.connection.db.admin().ping()` returns `{ ok: 1 }`.

---

## 3. Schema Models & Data Persistence Verification

Every core recruitment and operational domain record persists in MongoDB Atlas with strict schema validation:

| Collection | Model File | Validated Schema Attributes | Persistence Status |
|---|---|---|---|
| `users` | `User.js` | Email, password hash, role (`company`, `candidate`, `admin`), adminRole, status (`active`, `suspended`, `deactivated`), companyId | **VERIFIED PERSISTED** |
| `companies` | `Company.js` | Name, website, industry, description, logo, billingTier (`starter`, `pro`), jobCount | **VERIFIED PERSISTED** |
| `candidates` | `Candidate.js` | Name, email, title, skills, experienceYears, hourlyRate, availability, bio, profileCompleted | **VERIFIED PERSISTED** |
| `resumes` | `Resume.js` | CandidateId, filename, originalName, mimeType, sizeBytes, status (`quarantine`, `verified`), checksum | **VERIFIED PERSISTED** |
| `jobs` | `Job.js` | CompanyId, title, description, skills, salaryMin, salaryMax, location, type, status (`active`, `draft`, `closed`, `archived`) | **VERIFIED PERSISTED** |
| `applications` | `Application.js` | JobId, candidateId, companyId, status (`Applied`, `Reviewing`, `Shortlisted`, `Interview Scheduled`, `Offered`, `Hired`, `Rejected`), history | **VERIFIED PERSISTED** |
| `interviews` | `Interview.js` | ApplicationId, candidateId, companyId, scheduledAt, durationMinutes, type, status, meetingUrl | **VERIFIED PERSISTED** |
| `placementfees` | `PlacementFee.js` | ApplicationId, companyId, candidateId, amount ($2,500), status (`pending`, `invoiced`, `paid`, `disputed`), guaranteePeriodDays (90) | **VERIFIED PERSISTED** |
| `subscriptions` | `Subscription.js` | CompanyId, tier (`starter`, `pro`), price ($0, $199), status (`active`, `past_due`, `canceled`), billingCycle | **VERIFIED PERSISTED** |
| `invoices` | `Invoice.js` | CompanyId, amount, type (`placement_fee`, `subscription`), status (`draft`, `paid`, `void`), invoiceDate | **VERIFIED PERSISTED** |
| `auditlogs` | `AuditLog.js` | ActorId, action, targetType, targetId, ipAddress, userAgent, details, createdAt | **VERIFIED PERSISTED** |

---

## 4. Indexing & Query Optimization

Indexes have been established to prevent unindexed collection scans (`COLLSCAN`) during high-traffic queries:

1. **`users`:**
   - `{ email: 1 }`: Unique index for fast authentication lookups.
2. **`jobs`:**
   - `{ companyId: 1, status: 1 }`: Compound index for employer job list filtering.
   - `{ title: 'text', description: 'text', 'skills.name': 'text' }`: Text search index.
3. **`applications`:**
   - `{ jobId: 1, candidateId: 1 }`: Unique compound index enforcing duplicate application prevention.
   - `{ companyId: 1, status: 1 }`: Fast pipeline status filtering for recruiter dashboards.
   - `{ candidateId: 1 }`: Instant retrieval of a candidate's application history.
4. **`interviews`:**
   - `{ companyId: 1, scheduledAt: 1 }`: Calendar date range queries.
   - `{ candidateId: 1, scheduledAt: 1 }`: Candidate schedule queries.
5. **`auditlogs`:**
   - `{ createdAt: -1 }`: Reverse chronological audit timeline.

---

## 5. Security & Network Access Architecture

### 5.1 Current Development Network Access Rule
- **Current Atlas Entry:** `0.0.0.0/0` (Anywhere).
- **Risk Assessment:** While MongoDB Atlas enforces mandatory SCRAM-SHA-256 user authentication and TLS 1.3 encryption in transit, IP-level open access increases the attack surface against brute-force and credential stuffing.
- **Production Remediation Plan:**
  1. Determine the static public egress IP address of the production application hosting environment (e.g., AWS NAT Gateway, Render static egress, DigitalOcean App Platform egress).
  2. Add the specific production egress CIDR block to the MongoDB Atlas Network Access IP Access List.
  3. Verify connection from the production container.
  4. Revoke the `0.0.0.0/0` rule from the Atlas dashboard.

### 5.2 Encryption & Integrity
- **In-Transit:** TLS 1.3 enforced by default on MongoDB Atlas.
- **At-Rest:** AES-256 encryption-at-rest enabled on Atlas storage volumes.
- **Connection String Protection:** Handled strictly via `MONGO_URI` environment variable; zero credentials committed to Git.

---

## 6. Backup, Restoration & Disaster Recovery Plan

1. **Automated Continuous Backups:**
   - Atlas Point-in-Time Restore (PITR) enabled.
   - Automated hourly snapshots with 7-day retention policy.
   - Daily snapshots retained for 30 days.
2. **Restoration Runbook:**
   - In the event of catastrophic data corruption, initiate PITR through the MongoDB Atlas console to a new cluster instance or point-in-time state.
   - Update `MONGO_URI` in production secret manager and restart the backend containers.
3. **Data Integrity Migrations:**
   - Scripted migrations located in `server/src/services/migrationService.js` to handle schema version transitions safely.
