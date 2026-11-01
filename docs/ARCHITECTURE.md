# Hirevoxa — System Architecture

**Document Version:** 2.0.0<br>
**Current Milestone:** Phase 5 (Commercial Monetization & Live Atlas Persistence)<br>
**Location:** `docs/ARCHITECTURE.md`

---

## 1. System Overview

Hirevoxa is a two-sided recruitment and talent-matching marketplace that connects US technology organizations with pre-vetted senior software engineering talent across Latin America (Brazil, Argentina, Colombia, Mexico).

### Core Architectural Pillars
1. **Nearshore Alignment:** Real-time continental workday overlap (EST, CST, PST, BRT), eliminating latency typical of overseas outsourcing.
2. **Deterministic Matching Engine:** Mathematical multi-factor candidate-requisition compatibility scoring (skills, seniority, timezone overlap) rather than black-box AI approximations.
3. **Dual-Tier Monorepo:** Clean decoupling between Vite/React single-page application and Express RESTful API backend.
4. **Resilient Dual-Mode Storage:** Strict MongoDB Atlas persistence for production runtime paired with an isolated in-memory adapter (`inMemoryStore.js`) for deterministic test execution.
5. **Zero-Trust Role-Based Access Control:** Distinct workspaces and token claims for Candidates (`/candidate/*`), Employers (`/app/*`), and Platform Administrators (`/admin/*`).

---

## 2. Monorepo Organization

```
HireVoxa/
├── client/                     # Frontend Client Single Page Application (SPA)
│   ├── src/
│   │   ├── components/         # Atomic UI primitives, tables, modals, 3D canvas
│   │   ├── context/            # AuthContext (JWT session state, login/register/logout)
│   │   ├── layouts/            # DashboardLayout, CandidateLayout, AdminLayout
│   │   ├── pages/              # Recruiter, Candidate, and Admin page views
│   │   └── services/           # api.js (Axios-like fetch client with credentials & CSRF)
│   ├── vite.config.js          # Vite build & bundler configuration
│   └── package.json            # Client scripts and dependencies
│
├── server/                     # Backend API Service
│   ├── src/
│   │   ├── config/             # db.js, pricing.js
│   │   ├── controllers/        # Route controllers (auth, jobs, candidates, interviews, admin, billing)
│   │   ├── middleware/         # authMiddleware, adminAuthMiddleware, entitlementMiddleware, errorHandler
│   │   ├── models/             # Mongoose schemas (User, Company, Candidate, Job, Application, etc.)
│   │   ├── routes/             # Express router endpoints
│   │   ├── scripts/            # verifyConnection.js, bootstrapAdmin.js
│   │   ├── seed/               # seed.js, seedData.js
│   │   ├── services/           # matchingService, applicationLifecycleService, resumeStorage, inMemoryStore
│   │   └── server.js           # Express app initialization, middleware pipeline, graceful shutdown
│   ├── tests/                  # Automated test runner suites (171 passing tests across 19 suites)
│   └── package.json            # Server scripts and dependencies
│
└── docs/                       # Authoritative platform documentation
    ├── archive/                # Historical audits, phase reports, and QA matrices
    ├── ARCHITECTURE.md         # This document
    ├── DATABASE.md             # Schema reference, indexing, and connection lifecycle
    ├── DEPLOYMENT.md           # Configuration, Atlas networking, and environment setup
    ├── TESTING.md              # Automated test runner and quality assurance guidelines
    ├── MONETIZATION.md         # Pricing tiers, placement billing, and entitlements
    ├── FLOW.md                 # Complete system flow and lifecycle documentation
    └── PROJECT_STATE_AND_PHASE_TRACKER.md # Authoritative roadmap and phase tracker
```

---

## 3. Frontend Architecture

- **Core Framework:** React 19 SPA bundled with Vite 8.
- **Styling System:** TailwindCSS with modern dark palette (`#090909`, `#111111`, `#171717`, `#202020`, `#303030`, `#F5F5F5`).
- **Interactive 3D Elements:** Three.js WebGL canvas (`Hero3DCanvas.jsx`) rendering dynamic geometry with orbit animations.
- **Client Routing:** React Router v7 with declarative route guards:
  - `ProtectedRoute allowedRoles={['company', 'admin']}` &rarr; `/app/*`
  - `ProtectedRoute allowedRoles={['candidate']}` &rarr; `/candidate/*`
  - `ProtectedRoute allowedRoles={['admin']}` &rarr; `/admin/*`
- **Session Management:** `AuthContext.jsx` manages active user profile, tokens, role dispatch, and HttpOnly cookie coordination.

---

## 4. Backend Architecture

- **Runtime:** Node.js 22 LTS with ECMAScript Modules (`"type": "module"`).
- **HTTP Server:** Express 4.21 with Helmet security headers, CORS origin whitelisting with credential support, and Express Rate Limit (300 requests / 15 min window).
- **Security & Authorization:**
  - Password hashing via `bcryptjs` (salt rounds: 10).
  - Signed JSON Web Tokens (`jsonwebtoken`) containing user ID, role, companyId, and status.
  - HttpOnly, SameSite cookie dispatch paired with `Authorization: Bearer <token>` dual-auth compatibility.
  - Express middleware: `protect` (verifies token, checks suspension), `authorize(...roles)` (verifies role), `requireAdminRole(...roles)` (verifies 3-tier admin RBAC: `owner`, `ops_admin`, `analyst`).

---

## 5. Deterministic Matching Engine

The matching engine (`server/src/services/matchingService.js`) calculates a normalized score (0–100%) between candidates and job requisitions using weighted vectors:

- **Skills Compatibility (50%):** Jaccard index between required skills and candidate skills, with partial sub-string matching support.
- **Seniority & Experience (25%):** Evaluates candidate's verifiable years of experience against minimum job requirements. Candidates meeting or exceeding the minimum receive maximum points.
- **Time Zone Overlap (25%):** Computes synchronous working hour overlap between the requisition's timezone requirement (EST, CST, PST, BRT) and candidate location (COT, ART, BRT, etc.).
