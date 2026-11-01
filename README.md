# Hirevoxa — Vetted Latin American Engineering Talent Platform

Hirevoxa connects US-based technology companies with thoroughly vetted senior software engineers across Latin America (including Brazil, Argentina, Colombia, and Mexico) through a deterministic matching engine, synchronous US continental timezone alignment, and integrated recruitment workflows.

---

## Technology Stack

- **Frontend (`client/`):** React 19 SPA, Vite 8, TailwindCSS 3, React Router v7, Lucide Icons, and Three.js WebGL canvas.
- **Backend (`server/`):** Node.js 22 LTS, Express 4.21 REST API, Helmet security headers, cookie-based session management, CORS protection, and Express Rate Limit.
- **Data & Persistence:** Mongoose 8.10 ODM with MongoDB Atlas replica set persistence, multi-attempt connection resilience, and credential sanitization; paired with an isolated in-memory adapter for test runs.
- **Testing:** Native Node.js Test Runner (`node:test`) covering 171 automated unit, integration, RBAC, and lifecycle tests across 19 suites.

---

## Quick Start & Installation

### Prerequisites
- **Node.js:** >= 20.0.0
- **npm:** >= 10.0.0
- **MongoDB:** MongoDB Atlas replica set URI or local MongoDB instance

### Installation
```bash
# Clone the repository and enter the directory
git clone <repo-url>
cd HireVoxa

# Install root dependencies
npm install

# Install client and server dependencies
npm --prefix client install
npm --prefix server install
```

### Environment Setup
Create `server/.env` based on `.env.example`:
```bash
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@hirevoxa-cluster.uvzqbhj.mongodb.net/hirevoxa?retryWrites=true&w=majority
ALLOW_IN_MEMORY_DEMO=true
JWT_SECRET=your_jwt_secret_dev_key_here
```

### Running Locally
```bash
# Start both server (port 5000) and client (port 5173) concurrently
npm run dev

# Or start services individually:
npm run dev:server    # Express API on http://localhost:5000
npm run dev:client    # Vite frontend on http://localhost:5173
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **System Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Database Connectivity Diagnostics:** `npm --prefix server run db:check`

### Quality Assurance & Automated Tests
```bash
# Run backend test suite (171 tests across 19 suites)
npm test

# Build frontend production bundle
npm run build

# Run frontend linting
npm --prefix client run lint
```

---

## Documentation Directory

Authoritative, current platform documentation is organized within the [`docs/`](docs/) directory:

- [**System Architecture (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md): Monorepo structure, frontend architecture, matching engine, and security subsystems.
- [**Database Architecture (`docs/DATABASE.md`)**](docs/DATABASE.md): Mongoose schemas, collections, indexing strategies, and connection resilience.
- [**Deployment Guide (`docs/DEPLOYMENT.md`)**](docs/DEPLOYMENT.md): Production environment variables, Atlas Network Access, and admin bootstrapping.
- [**Quality Assurance & Testing (`docs/TESTING.md`)**](docs/TESTING.md): Test runner configuration, test suite catalog, build, and lint checks.
- [**Monetization & Entitlements (`docs/MONETIZATION.md`)**](docs/MONETIZATION.md): Pricing tiers (Candidate Free Forever, Starter $0, Placement $2,500, Pro $199/mo), billing webhooks, and limits.
- [**Operations Admin Runbook (`docs/ADMIN-OPERATIONS-RUNBOOK.md`)**](docs/ADMIN-OPERATIONS-RUNBOOK.md): Administrative runbook for 3-tier RBAC, moderation, and audit logs.
- [**System Lifecycle Flow (`docs/FLOW.md`)**](docs/FLOW.md): Detailed user journeys, role boundaries, and end-to-end platform workflows.
- [**Project State & Phase Tracker (`docs/PROJECT_STATE_AND_PHASE_TRACKER.md`)**](docs/PROJECT_STATE_AND_PHASE_TRACKER.md): Current development milestones, verified evidence, and roadmap.

### Production Readiness Audit Deliverables
- [**Master Production Readiness Report (`docs/PRODUCTION_READINESS_REPORT.md`)**](docs/PRODUCTION_READINESS_REPORT.md): Verdict (**CONDITIONALLY READY**), category scores, and findings.
- [**Production Blockers Register (`docs/PRODUCTION_BLOCKERS.md`)**](docs/PRODUCTION_BLOCKERS.md): Detailed root causes and remediation steps for all 5 pre-launch blockers.
- [**Application Security Audit (`docs/SECURITY_AUDIT_REPORT.md`)**](docs/SECURITY_AUDIT_REPORT.md): In-depth security analysis, RBAC validation, and CVE findings.
- [**Deployment Readiness Checklist (`docs/DEPLOYMENT_READINESS_CHECKLIST.md`)**](docs/DEPLOYMENT_READINESS_CHECKLIST.md): Operational pre-flight checklist.
- [**Production Test Evidence (`docs/PRODUCTION_TEST_EVIDENCE.md`)**](docs/PRODUCTION_TEST_EVIDENCE.md): Raw concurrency benchmarks, automated test logs, and Atlas traces.

---

## Historical Reports & Archive

Past audit reports, QA test matrices, phase summaries, and historical logs are archived in [`docs/archive/`](docs/archive/):

- [`docs/archive/phase-reports/`](docs/archive/phase-reports/): Phase completion reports (Phase 0 through Phase 4.5).
- [`docs/archive/qa-reports/`](docs/archive/qa-reports/): Live E2E QA reports, defect registers (`FINAL-QA-DEFECTS.md`), and test matrices.
- [`docs/archive/old-audits/`](docs/archive/old-audits/): Initial pre-alpha technical audits and historical system reports.
- [`docs/archive/superseded/`](docs/archive/superseded/): Superseded stubs and consolidated operational specs.
