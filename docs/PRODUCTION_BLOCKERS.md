# Hirevoxa — Production Blockers & Remediation Register

**Document Version:** 1.0.0<br>
**Audit Date:** 2026-10-31<br>
**Auditor:** Principal Software Architect, Senior Application Security & DevOps Lead<br>
**Target Platform:** Hirevoxa Recruitment & Talent Matching Platform (`G:\HireVoxa`)<br>
**Overall Readiness Verdict:** **CONDITIONALLY READY**

---

## 1. Executive Blockers Summary

While Hirevoxa's core application features, database schemas, role authorization, tenant isolation, and UI workflows are implemented and verified against MongoDB Atlas, the platform cannot be deployed to an unmonitored production environment until the following **5 specific production blockers** are resolved.

| Blocker ID | Severity | Category | Component / Location | Description & Impact |
| :--- | :---: | :---: | :--- | :--- |
| **BLK-01** | **HIGH** | Payments | `server/src/controllers/billingController.js` | Live Payment Gateway SDK (Stripe) not installed or connected. Real credit card / ACH billing cannot execute. |
| **BLK-02** | **HIGH** | Storage | `server/src/services/resumeStorage.js` | Candidate resumes stored on local filesystem (`server/storage/resumes`). Will suffer data loss in containerized/ephemeral cloud deployments. |
| **BLK-03** | **HIGH** | Security | `server/node_modules/body-parser` | High-severity vulnerability in Express dependency (`body-parser < 1.20.9` — DoS via trailing bytes). |
| **BLK-04** | **MEDIUM** | Network | MongoDB Atlas Network Access | Cluster firewall currently allows global access (`0.0.0.0/0`) for dynamic development; requires static egress CIDR or VPC peering for production. |
| **BLK-05** | **MEDIUM** | DevOps | Monorepo Root | Absence of containerization (`Dockerfile`), CI/CD pipelines, and automated database snapshot/backup scripts. |

---

## 2. In-Depth Blocker Analysis & Exact Remediation

### BLK-01: Live Third-Party Payment Gateway Not Integrated
- **Severity:** HIGH (Commercial Blocker)
- **Status:** **BLOCKED**
- **Affected Files:**
  - [`server/package.json`](file:///g:/HireVoxa/server/package.json)
  - [`server/src/controllers/billingController.js`](file:///g:/HireVoxa/server/src/controllers/billingController.js#L13-L20)
  - [`server/src/config/pricing.js`](file:///g:/HireVoxa/server/src/config/pricing.js)
  - [`server/.env`](file:///g:/HireVoxa/server/.env)
- **Detailed Findings:**
  1. The business logic, integer minor-unit pricing ($199/mo Pro subscription, $2,500 placement fee), entitlement checks, and webhook payload handlers are fully written and pass unit tests.
  2. However, no third-party payment gateway SDK (e.g. `stripe` or `@stripe/stripe-js`) is installed in `server/package.json`.
  3. `billingController.js` generates simulated IDs (`sub_${randomUUID()}`, `cus_${randomUUID()}`) rather than dispatching to an authoritative payment processor.
  4. Live customer cards cannot be charged, and actual subscription renewals cannot be authorized.
- **Remediation Plan:**
  1. Run `npm --prefix server install stripe`.
  2. Provision a verified Stripe organization account and obtain live API keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`).
  3. Replace simulated session creation in `createSubscription()` and `triggerHiringPlacementFee()` with Stripe Checkout / PaymentIntents API.
  4. Register the production webhook URL `https://api.hirevoxa.com/api/billing/webhook` in the Stripe Dashboard.

---

### BLK-02: Candidate Resumes Stored on Ephemeral Local Disk
- **Severity:** HIGH (Data Persistence Blocker)
- **Status:** **NOT READY FOR MULTI-INSTANCE DEPLOYMENT**
- **Affected Files:**
  - [`server/src/services/resumeStorage.js`](file:///g:/HireVoxa/server/src/services/resumeStorage.js#L14-L35)
  - [`server/storage/resumes/`](file:///g:/HireVoxa/server/storage/resumes/)
- **Detailed Findings:**
  1. Uploaded candidate resumes are written directly to local disk at `G:\HireVoxa\server\storage\resumes\`.
  2. While the local adapter enforces security checks (magic byte verification, 5 MB size limit, random UUID file keys, privacy access checks), local disk storage is ephemeral in modern container platforms (Docker, AWS ECS, Google Cloud Run, Render, Kubernetes).
  3. If a container restarts, redeploys, or scales to multiple instances, candidate resumes stored on the local disk will be lost or inaccessible across replica nodes.
- **Remediation Plan:**
  1. Install AWS S3 SDK (`@aws-sdk/client-s3`) or Google Cloud Storage client (`@google-cloud/storage`).
  2. Create an S3 storage provider in `resumeStorage.js` enabled when `NODE_ENV === 'production'`.
  3. Store resumes in a private S3 bucket with server-side encryption (`SSE-S3` or `SSE-KMS`).
  4. Serve authorized resume downloads via private pre-signed S3 URLs (expiring in 15 minutes) or streaming proxies.

---

### BLK-03: Known Dependency Vulnerabilities (`npm audit`)
- **Severity:** HIGH (Application Security Blocker)
- **Status:** **ACTION REQUIRED**
- **Affected Package:** `server/package.json` (`body-parser < 1.20.9`, `qs 6.7.0 - 6.16.0`)
- **Detailed Findings:**
  1. Running `npm audit --prefix server` reported:
     - `body-parser < 1.20.9` (High Severity — Denial of Service via trailing bytes after compressed request body: `GHSA-27r3-jxmh-p828`).
     - `qs 6.7.0 - 6.16.0` (Moderate Severity — Denial of Service in arrayFormat parsing: `GHSA-6pq8-jhm2-2vcw`).
  2. Running `npm audit --prefix client` reported:
     - `postcss-selector-parser < 6.1.5` (Moderate Severity — Quadratic complexity in flat selector parsing: `GHSA-rj75-hqrm-r3gf`).
- **Remediation Plan:**
  1. Update root Express dependency in `server/package.json` to the latest patch release (Express `^4.21.2` pulls updated `body-parser` and `qs`).
  2. Run `npm --prefix server audit fix` and `npm --prefix client audit fix`.
  3. Re-run backend regression tests (`npm test`) to verify compatibility.

---

### BLK-04: Atlas Network Access Open to Wildcard (`0.0.0.0/0`)
- **Severity:** MEDIUM (Network Security Blocker)
- **Status:** **CONFIGURATION REQUIRED FOR PRODUCTION**
- **Component:** MongoDB Atlas Security &rarr; Network Access
- **Detailed Findings:**
  1. During live verification, Atlas Network Access was configured to allow connections from `0.0.0.0/0` to accommodate dynamic development IPs.
  2. While database authentication is secured by user credentials and password hashes, leaving the cluster port 27017 exposed to the public internet leaves the cluster vulnerable to brute-force attacks and network scanning.
- **Remediation Plan:**
  1. When provisioning the production application hosting (AWS EC2, ECS, or dedicated VPS), obtain the static outbound IP address of the server or NAT Gateway.
  2. Remove `0.0.0.0/0` from Atlas Network Access.
  3. Add only the static production CIDR (e.g., `198.51.100.54/32`) or establish AWS VPC Peering / PrivateLink between the application VPC and MongoDB Atlas.

---

### BLK-05: Absence of Automated CI/CD & Database Backup Automation
- **Severity:** MEDIUM (DevOps & Disaster Recovery Blocker)
- **Status:** **NOT CONFIGURED**
- **Component:** DevOps & Repository Automation
- **Detailed Findings:**
  1. There are no automated CI/CD workflows (e.g. `.github/workflows/ci.yml`) to automatically build and test pull requests.
  2. There is no automated database snapshot or backup export cron configured in code to safeguard against accidental operator data deletion.
- **Remediation Plan:**
  1. Create a GitHub Actions workflow `.github/workflows/ci.yml` that runs `npm test`, `npm run build`, and `npm --prefix client run lint` on all commits.
  2. Enable continuous cloud backups in MongoDB Atlas (with a 7-day retention policy and point-in-time recovery).
  3. Configure a containerized `Dockerfile` for multi-stage building of client assets and Node API server execution.
