# Production Infrastructure & Deployment Plan

**Project:** Hirevoxa Recruitment Marketplace<br>
**Document ID:** `docs/PRODUCTION/DEPLOYMENT_PLAN.md`<br>
**Assessment Date:** October 31, 2026<br>
**Auditor Roles:** Principal DevOps & Cloud Infrastructure Engineer, Site Reliability Engineer

---

## 1. Production Architecture & Hosting Strategy

Hirevoxa is designed for flexible, reliable deployment using containerized services and cloud-managed databases.

```
                           [ Cloudflare / Route 53 DNS ]
                                         |
                                         | (HTTPS / TLS 1.3 Termination)
                                         v
                     +---------------------------------------+
                     |           Ingress / CDN Layer         |
                     | - SSL Termination                     |
                     | - DDoS / WAF Filtering                |
                     | - Static Asset Caching                |
                     +-------------------+-------------------+
                                         |
                                         | (Reverse Proxy / Routing)
                                         v
                     +---------------------------------------+
                     |        Hirevoxa Application Tier      |
                     |    Container: Node.js 20 LTS          |
                     | - Static React Bundle (`/client/dist`)|
                     | - Express.js REST API (`/api/*`)      |
                     | - Non-root execution (`hirevoxa` user)|
                     +-------------------+-------------------+
                                         |
                                         | (TLS 1.3 / SCRAM-SHA-256)
                                         v
                     +---------------------------------------+
                     |     MongoDB Atlas Managed Cluster     |
                     | - 3-Node Replica Set                  |
                     | - Restricted IP Whitelist             |
                     | - Continuous Automated Backups        |
                     +---------------------------------------+
```

---

## 2. Containerization & Production Build Specifications

### 2.1 Multi-Stage Dockerfile (`Dockerfile`)
The repository includes an optimized multi-stage `Dockerfile`:
- **Stage 1 (Frontend Builder):** Installs client dependencies and compiles Vite production bundle into `/app/client/dist`.
- **Stage 2 (Production Runtime):**
  - Base: `node:20-alpine` (lightweight, minimal attack surface).
  - Installs production-only server dependencies (`npm --prefix server ci --only=production`).
  - Creates dedicated unprivileged system user/group `hirevoxa:hirevoxa` (UID/GID 10001).
  - Copies compiled frontend bundle and backend source code.
  - Implements native Node health check polling `/api/health`.
  - Exposes port `5000`.

### 2.2 Local Container Orchestration (`docker-compose.yml`)
- Provides zero-dependency containerized testing with persistent volume mapping for resume uploads:
  ```bash
  docker compose up --build -d
  ```

---

## 3. Production Environment Variables & Secret Configuration

The following variables must be configured in the production hosting provider's Secret Manager (never committed to Git):

| Variable Name | Required Value Description | Sensitivity |
|---|---|---|
| `NODE_ENV` | `production` | Low |
| `PORT` | `5000` | Low |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@hirevoxa-cluster.uvzqbhj.mongodb.net/hirevoxa?retryWrites=true&w=majority` | **CRITICAL** |
| `JWT_SECRET` | 64-character high-entropy hexadecimal random string | **CRITICAL** |
| `COOKIE_SECRET` | 64-character high-entropy hexadecimal random string | **CRITICAL** |
| `CLIENT_URL` | Production domain (e.g., `https://hirevoxa.com`) | Medium |
| `STRIPE_SECRET_KEY` | Live Stripe API secret (`sk_live_...`) | **CRITICAL** |
| `STRIPE_WEBHOOK_SECRET` | Live Stripe webhook HMAC secret (`whsec_...`) | **CRITICAL** |
| `RESUME_STORAGE_DIR` | `/app/server/storage/resumes` (or cloud storage bucket name) | Low |

---

## 4. CI/CD Automation Pipeline

Automated continuous integration is established via `.github/workflows/ci.yml`:
1. **Trigger:** Push or pull request against `main` and `develop` branches.
2. **Build Matrix:** Node.js versions `20.x` and `22.x`.
3. **Pipeline Stages:**
   - Dependency verification & vulnerability audit (`npm audit --audit-level=high`).
   - Client code quality inspection (`npm --prefix client run lint`).
   - Server test suite execution (171 tests across 19 suites).
   - Frontend production bundle compilation (`npm --prefix client run build`).
   - Docker image build verification.

---

## 5. Step-by-Step Production Deployment Runbook

### Step 1: Pre-Deployment Verification
1. Ensure all CI/CD pipeline checks pass on GitHub.
2. Verify MongoDB Atlas cluster health and ensure a recent automated snapshot exists.
3. Obtain the static egress IP(s) of the production application cluster and add them to MongoDB Atlas Network Access.

### Step 2: Build & Release Execution
1. Trigger production build in deployment platform (e.g., Render, AWS ECS, DigitalOcean App Platform):
   ```bash
   git pull origin main
   docker build -t hirevoxa:release-v1.0.0 .
   ```
2. Inject production environment variables.
3. Start container instance.

### Step 3: Post-Deployment Smoke Test
1. Query `/api/health` to confirm HTTP 200 and healthy database readyState.
2. Visit `https://hirevoxa.com/` in an incognito window.
3. Execute synthetic login and verify HttpOnly cookie assignment.
4. Verify resume download authorization endpoint.
5. Check real-time application logs for any unhandled exceptions.

---

## 6. Rollback & Disaster Recovery Runbook

If a critical blocker is detected immediately following release:
1. **Instant Container Rollback:**
   - In the hosting control plane, switch the active container tag back to `hirevoxa:previous-stable`.
   - Traffic routes to the previous release within 30 seconds.
2. **Database State Rollback (if schema migration failed):**
   - Execute Point-in-Time Restore (PITR) in MongoDB Atlas console to the timestamp immediately preceding deployment.
   - Re-point application connection string if restoring to a parallel cluster.
3. **Post-Mortem & Incident Logging:**
   - Capture container stdout/stderr logs for root-cause diagnosis in staging.
