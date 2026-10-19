# Hirevoxa — Engineering Talent Hiring Platform

Hirevoxa connects US-based technology companies with thoroughly vetted software engineers across Latin America (including Brazil, Mexico, Colombia, and Argentina) through a focused, transparent hiring process featuring synchronous US timezone alignment.

---

## 1. Architectural Overview

Hirevoxa is a full-stack **MERN** application (MongoDB, Express, React, Node.js) structured as a unified monorepo:

```
HireVoxa/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS + Three.js)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Badges, Buttons, Modals, Skill Icons, Stat Cards
│   │   │   ├── dashboard/      # HeaderProfile, RecommendationHero, JobsTable
│   │   │   └── home/           # Hero3DCanvas (Three.js WebGL architectural scene)
│   │   ├── context/            # AuthContext (JWT, session persistence, demo switcher)
│   │   ├── layouts/            # Collapsible Sidebar & Dashboard Layout
│   │   ├── pages/              # LandingPage, Login, Register, ForgotPassword, Dashboard,
│   │   │                       # Recommended, Jobs, Talents, Interviews, Calendar, Messages,
│   │   │                       # Payments, Reports, Settings, NotFound
│   │   ├── services/           # Reusable API Client with Auth Header handling
│   │   └── index.css           # Global Black-First Design System Tokens
│   ├── index.html
│   └── vite.config.js
├── server/                     # Backend API Service (Node.js + Express)
│   ├── src/
│   │   ├── config/             # DB Connection & Dual-Mode Fallback Manager
│   │   ├── controllers/        # Auth, Candidates, Jobs, Interviews, Matching
│   │   ├── middleware/         # Auth JWT protect/authorize, Helmet, Rate Limiter, Error Handler
│   │   ├── models/             # Mongoose Schemas (User, Company, Candidate, Job, Interview, Shortlist, Message)
│   │   ├── routes/             # REST API Routes (/api/auth, /api/candidates, /api/jobs, etc.)
│   │   ├── seed/               # LatAm Engineering Candidate & Job Seed Records
│   │   ├── services/           # Deterministic Candidate-Job Matching & In-Memory Store
│   │   └── server.js           # Express App Configuration
│   └── tests/                  # Automated API, Auth, and Matching Unit Tests (13 tests)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Dual-Mode Database Architecture
- **MongoDB Mode:** If `MONGODB_URI` is provided, Mongoose connects to your MongoDB cluster (local or Atlas) with indexes and schemas.
- **In-Memory Demonstration Mode:** If `MONGODB_URI` is omitted or temporarily unreachable, the backend automatically activates an in-memory data store seeded with realistic Latin American engineering candidates, jobs, and pre-seeded authentication profiles. Verified at `/api/health`.

---

## 2. Visual Design System — Black First

Strictly adheres to the black-first palette:
- **Main Background:** `#090909`
- **Sidebar Background:** `#111111`
- **Main Content:** `#0C0C0C`
- **Standard Surface:** `#1B1B1B`
- **Elevated Surface:** `#242424`
- **Hover Surface:** `#2A2A2A`
- **Borders:** `#333333` / `#222222`
- **Primary Text:** `#F5F5F5`
- **Secondary Text:** `#A3A3A3`
- **Muted Text:** `#777777`
- **Primary Button:** `#F5F5F5` (Dark text `#090909`)
- **Success:** Muted Green (`#10B981`)
- **Warning:** Restrained Amber (`#F59E0B`)
- **Error:** Muted Red (`#EF4444`)

---

## 3. Key Experiences

1. **3D Marketing Homepage (`/`)**:
   - Inspired by HUSD Dribbble reference.
   - Interactive Three.js WebGL hero rendering an architectural faceted titanium polyhedron, orbiting talent nodes, and dynamic mouse parallax with graceful WebGL fallback.
   - Bold editorial typography, structured 4-step workflow, featured roles, explainable matching matrix, and intake modal.

2. **Authenticated Dashboard (`/app`)**:
   - Faithful recreation of the recruitment dashboard reference.
   - Persistent left sidebar with badges (`Dashboard`, `Recommended (9+)`, `Jobs (4)`, `Talents (9)`, `Payment`, `Settings`).
   - Top account header: Richard Feynman user details, Esther Howard AE card, "Schedule Call" modal, and live notification drawer.
   - Prominent Recommendation panel directly beneath the header with candidate details, skills, score, and "Schedule Interview" flow.
   - "Your job" table underneath: Info, Skills (Python, JS, React), Experience, Commit., Status, Action ("View details").

3. **Full Recruitment Workspace**:
   - `/app/recommended`: Calibrated match scores, explainable fit breakdowns, shortlisting.
   - `/app/talents`: Filterable directory by skills, seniority, country, timezone, rates.
   - `/app/jobs`: Job creation, editing, and status management (Open, Trial, Fulfilled, On Hold, Draft).
   - `/app/interviews`: Interview scheduling, status lifecycle (Pending, Confirmed, Completed, Cancelled).
   - `/app/calendar`: Weekly hiring event timeline aligned with EST, CST, PST, BRT.
   - `/app/messages`: Persistent candidate messaging.
   - `/app/reports`: Analytics computed from active records (country distribution, top competencies).
   - `/app/settings`: Profile, company, and notification alerts.
   - `/login`, `/register`, `/forgot-password`: JWT auth with fast demo switching.

---

## 4. Quick Start & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Run Locally
```bash
# Install root dependencies
npm install

# Run backend tests (all 13 tests passing)
npm test

# Run both client and server concurrently
npm run dev
```

- Frontend: `http://localhost:5173/`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
