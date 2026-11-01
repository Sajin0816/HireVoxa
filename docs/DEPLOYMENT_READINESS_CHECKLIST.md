# Hirevoxa — Production Deployment Readiness Checklist

**Document Version:** 1.0.0<br>
**Target Environment:** Production Cloud Infrastructure<br>
**Location:** `docs/DEPLOYMENT_READINESS_CHECKLIST.md`

---

## 1. Pre-Flight Verification Matrix

Use this checklist to track mandatory operational milestones prior to customer traffic cutover.

### Category 1: Environment & Secrets Configuration
- [ ] **Production `server/.env` Provisioned:** Populated with unique production secrets; strictly excluded from Git.
- [ ] **High-Entropy `JWT_SECRET`:** Configured with a cryptographically generated 64-character token; verified that server crashes if default secret is detected.
- [ ] **`NODE_ENV=production`:** Verified active in backend process environment.
- [ ] **`REQUIRE_DB=true`:** Verified active; ensures in-memory fallback is completely disabled.
- [ ] **`ALLOW_IN_MEMORY_DEMO=false`:** Disables all ephemeral test adapters.
- [ ] **`CLIENT_ORIGIN` Configured:** Exact production origin domain set (e.g., `https://hirevoxa.com`), preventing unauthorized CORS access.

---

### Category 2: Database & Atlas Network Security
- [ ] **Production Atlas Cluster Tier:** Cluster sized appropriately (M10+ recommended for dedicated RAM and high IOPS).
- [ ] **Static IP Whitelisting / VPC Peering:** Removed `0.0.0.0/0` from Atlas Network Access; whitelisted only production server egress IPs or established AWS VPC Peering / PrivateLink.
- [ ] **Database User Permissions:** Created dedicated production DB user with least-privilege `readWrite` permissions on database `hirevoxa`.
- [ ] **Continuous Cloud Backups Active:** Atlas point-in-time recovery and snapshot schedule enabled (minimum 7-day retention).
- [ ] **Database Connection Health:** Verified via `npm --prefix server run db:check` returning `{ ok: 1 }`.

---

### Category 3: Candidate Resume Cloud Object Storage
- [ ] **Cloud Storage Provider Configured:** Replaced local disk storage (`server/storage/resumes`) with AWS S3 or Google Cloud Storage.
- [ ] **Bucket Access Security:** S3 bucket blocks all public access (`BlockPublicAcls`, `BlockPublicPolicy`).
- [ ] **Server-Side Encryption:** Enabled AES-256 or KMS encryption on the S3 bucket.
- [ ] **CORS & Signed URLs:** Download endpoints stream through backend authorization or issue short-lived (15-minute) pre-signed S3 URLs.

---

### Category 4: Payment Gateway & Commercial Infrastructure
- [ ] **Stripe Organization Account Created:** Completed business verification and legal registration.
- [ ] **Stripe SDK Installed:** Added `stripe` to `server/package.json` dependencies.
- [ ] **Live API Keys Configured:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `BILLING_WEBHOOK_SECRET` added to `server/.env`.
- [ ] **Webhook Endpoint Configured:** `POST https://api.hirevoxa.com/api/billing/webhook` registered in Stripe Dashboard with events `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`.
- [ ] **Idempotency Verified:** Tested duplicate webhook payloads to ensure zero duplicate subscription upgrades or duplicate placement fee invoices.

---

### Category 5: Web Server, Reverse Proxy & SSL/TLS
- [ ] **SSL/TLS Certificates:** HTTPS enforced with modern TLS 1.3/1.2; HTTP automatically redirects to HTTPS.
- [ ] **Reverse Proxy (Nginx / Cloudflare):** Configured with proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
- [ ] **Compression & Static Caching:** Enabled gzip/brotli compression and 1-year cache headers for immutable Vite assets (`/assets/*`).
- [ ] **Process Management:** Node.js process managed via PM2, systemd, or Docker container with automatic crash recovery (`restart: always`).

---

### Category 6: Operations & Administration
- [ ] **Root Platform Owner Bootstrapped:** Initial administrative account created via `npm --prefix server run bootstrap:admin`.
- [ ] **Administrative 2FA / SSO:** Strong master password and operational access protocol established.
- [ ] **Audit Logging Monitored:** Verified that admin actions (suspension, verification, moderation) persist in `auditlogs` collection.

---

### Category 7: Monitoring & Disaster Recovery
- [ ] **Application Error Tracking:** Sentry or Datadog initialized on both client and server.
- [ ] **Uptime Monitoring:** External probe pinging `GET https://api.hirevoxa.com/api/health` every 60 seconds with PagerDuty/Slack alerting.
- [ ] **Disaster Recovery Playbook:** Documented restoration procedure from MongoDB Atlas backup snapshots.
