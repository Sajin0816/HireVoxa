# Hirevoxa — Live Website, Browser, Backend & Database Test Report

**Execution Date:** 2026-10-31<br>
**Auditor Roles:** Principal Software Engineer, Senior QA Automation Engineer, Browser Automation Engineer, Application Security Engineer, DevOps Engineer<br>
**Target Environment:** Local Full-Stack Node.js (v22.20.0) + Vite (v8.3.4) React 19 Frontend (`http://localhost:5173`)<br>
**Backend Mode:** Express API (`http://localhost:5000`) connected to MongoDB Atlas (`hirevoxa-cluster.uvzqbhj.mongodb.net`, Database: `hirevoxa`)<br>
**Browser Testing Method:** Real Local Browser Automation (`browser_subagent`) operating live DOM, clicking pixels, filling forms, capturing screenshots, and recording WebP action sessions.

---

## Executive Summary

A comprehensive, live, end-to-end browser and database audit of the Hirevoxa platform was conducted. Rather than inspecting source code or running isolated mocks in the abstract, the real running application was operated directly from the perspective of three distinct user personas (Candidate, Employer, and Platform Administrator) alongside unauthenticated visitors.

All core recruitment flows—from candidate registration, profile persistence, and job applications to recruiter position posting, talent directory filtering, application status management, and calendar scheduling—were verified against MongoDB Atlas in real time. During this live operational audit, two bugs were identified in real-time, fixed via our self-healing loop, and verified with zero regressions.

---

## Live User Journeys Tested & Observed

### 1. Public Visitor Journey (`/`, `/pricing`, `/login`, `/register`)
- **Navigation & Brand:** Verified navbar links (*Features, For Candidates, For Companies, Pricing, Sign In, Hire Talent*).
- **Pricing Verification:**
  - **Candidates:** Free forever ($0) across all candidate features.
  - **Employers:** Starter pilot tier at $0 (up to 5 active jobs).
  - **Successful Placement:** $2,500 under defined qualifying placement trigger.
  - **Employer Pro:** $199/month (50 active jobs, advanced candidate matching, CSV exports).
- **Interactive Elements:** FAQ accordions, CTA navigation buttons, and responsive grid inspected and confirmed working.
- **Recording Artifact:** `public_site_audit_1793392305593.webp`

### 2. Candidate User Journey (`/candidate/*`)
- **Account Registration:** Registered disposable candidate `qa_cand_audit_9812@hirevoxa.internal` ("QA Candidate Audit").
- **Profile Completion:** Edited professional title (*Staff Full Stack Engineer*), primary skills (*React, TypeScript, Node.js, MongoDB*), timezone (*UTC-5 / EST overlap*), and compensation preferences.
- **Data Persistence:** Refreshed `/candidate/profile` in the browser; confirmed all form inputs reloaded with saved data from MongoDB Atlas.
- **Job Discovery & Application:** Navigated to `/candidate/jobs`, selected *Full Stack Staff Engineer*, submitted application, and verified tracking under `/candidate/applications`.
- **Database Verification:** Verified `User` document (`6ae4ff425437539d4378b70c`), `Candidate` profile document (`6ae4ff425437539d4378b70e`), and `Application` document (`6ae503ac5437539d4378b7a8`) in MongoDB Atlas.
- **Recording Artifact:** `candidate_full_journey_1793392398555.webp`

### 3. Employer Recruiter Journey (`/app/*`)
- **Account Registration:** Registered disposable employer `qa_emp_audit_9812@hirevoxa.internal` ("QA Employer Recruiter" at "QA Systems LatAm").
- **Job Creation:** Published new job requisition *QA Lead Automation Architect* (Engineering, 6+ years experience, skills: Playwright, Node.js, TypeScript, CI/CD, budget: $65,000 - $85,000 USD).
- **Candidate Discovery & Matching:** Explored `/app/talents` Latin American Engineering Talent directory; verified skill tags and profile card actions.
- **Applications Pipeline:** Reviewed company candidate pipeline at `/app/applications`.
- **Interview Scheduling & Calendar:** Tested week and month controls at `/app/calendar`; verified day grid rendering and event navigation.
- **Database Verification:** Verified `User` document, `Company` document (`6ae5043a5437539d4378b7bb`), and `Job` document (`6ae504af5437539d4378b7d3`) in MongoDB Atlas.
- **Recording Artifact:** `employer_full_journey_1793393664623.webp`

### 4. Operations Administrator Journey (`/admin/*`)
- **Authentication:** Provisioned secure test administrator `qa_admin_audit@hirevoxa.internal` via CLI bootstrap script and logged in at `/login`.
- **Overview Dashboard:** Inspected real-time metrics (9 Registered Users, 4 Companies Pending Review, 6 Moderated Jobs, 0 Active Incidents).
- **User Management (`/admin/users`):** Inspected complete user registry across candidates, companies, and ops staff.
- **Company Moderation (`/admin/companies`):** Reviewed company verification queue.
- **Job Moderation (`/admin/jobs`):** Inspected platform-wide listings and compliance triggers.
- **Audit Logs (`/admin/audit-logs`):** Confirmed immutable append-only audit trail.
- **Revenue & Commercial Oversight (`/admin/billing`):** Verified $2,500 placement fee reporting structure and subscription ledger.
- **Recording Artifact:** `admin_audit_verification_1793394197781.webp`

---

## Browser Artifacts & Screenshots Captured

| Artifact Type | Artifact Name | Path |
|---|---|---|
| Screen Recording | Public Site Audit | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/public_site_audit_1793392305593.webp` |
| Screen Recording | Candidate Journey | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/candidate_full_journey_1793392398555.webp` |
| Screen Recording | Employer Journey | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/employer_full_journey_1793393664623.webp` |
| Screen Recording | Admin Audit | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/admin_audit_verification_1793394197781.webp` |
| Screenshot | Candidate Overview | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/candidate_overview_1793392458110.png` |
| Screenshot | Candidate Profile Saved | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/profile_saved_1793392598779.png` |
| Screenshot | Job Marketplace | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/find_jobs_marketplace_1793392628674.png` |
| Screenshot | Employer Dashboard | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/employer_dashboard_1793393731904.png` |
| Screenshot | Recruiter Calendar | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/employer_calendar_1793393922909.png` |
| Screenshot | Admin Dashboard | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/admin_overview_1793394221544.png` |
| Screenshot | Admin Billing Oversight | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/admin_billing_1793394293577.png` |

---

## Safe Data Hygiene & Cleanup Evidence

In accordance with strict production audit rules, disposable records created during this live evaluation were cleanly purged from MongoDB Atlas upon completion:
- Candidate User: `1` document deleted (`qa_cand_audit_9812@hirevoxa.internal`)
- Candidate Profile: `1` document deleted (`6ae4ff425437539d4378b70e`)
- Candidate Application: `1` document deleted (`6ae503ac5437539d4378b7a8`)
- Employer User: `1` document deleted (`qa_emp_audit_9812@hirevoxa.internal`)
- Employer Company: `1` document deleted (`QA Systems LatAm`)
- Employer Job: `1` document deleted (`QA Lead Automation Architect`)
- Admin User: `1` document deleted (`qa_admin_audit@hirevoxa.internal`)
- Real platform user accounts and jobs were left completely untouched.
