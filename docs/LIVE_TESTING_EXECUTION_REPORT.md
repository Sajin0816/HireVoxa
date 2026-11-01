# Hirevoxa — Live Testing Execution Report (Three-Persona Simulation)

**Execution Date:** 2026-10-31<br>
**Project:** Hirevoxa (`G:\HireVoxa`)<br>
**Test Methodology:** Real Browser Automation (`browser_subagent`) operating live DOM, clicking pixels, typing into inputs, submitting forms, inspecting console/network, and capturing WebP recordings & PNG screenshots.<br>
**Connected Database:** MongoDB Atlas Replica Set (`hirevoxa-cluster.uvzqbhj.mongodb.net`, Database: `hirevoxa`, Mode: `mongodb`)<br>
**Frontend URL:** `http://localhost:5173` (Vite v8.3.4 React 19 SPA)<br>
**Backend URL:** `http://localhost:5000` (Node v22.20.0 + Express REST API)

---

## 1. Executive Summary

This report documents the live, multi-persona browser execution of the Hirevoxa recruitment marketplace. Three distinct personas were operated live in sequence on the same platform instance, sharing connected state in MongoDB Atlas:

1. **Persona A (Company / Hiring Manager):** "Northstar Technologies QA" (`qa_employer_northstar@hirevoxa.internal`)
2. **Persona B (Candidate / Software Engineer):** "Alex Morgan QA" (`qa_candidate_alexmorgan@hirevoxa.internal`)
3. **Persona C (Platform Administrator):** "Platform Administrator" (`qa_admin_ops@hirevoxa.internal`)

All recruitment stages—from company discovery and job requisition creation to candidate registration, profile completion, job discovery, application submission, candidate review, shortlisting, interview scheduling, calendar synchronization, and final hiring with placement fee generation ($2,500)—were executed end-to-end and verified in real time.

---

## 2. Live Session Video Recordings & Visual Evidence

| Persona / Phase | Browser WebP Video Recording | Captured Screenshots | Status |
|---|---|---|---|
| **Persona A: Company** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_a_company_1793395893495.webp` | `employer_dashboard_1793395973715.png`<br>`jobs_list_fullstack_1793396024106.png` | **PASS** |
| **Persona B: Engineer** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_b_submit_verified_1793399483645.webp` | `candidate_overview_1793396263539.png`<br>`job_submitted_success_1793399517217.png`<br>`candidate_applications_page_1793399530416.png` | **PASS** |
| **Persona A: Interview** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_a_resume_1793400511322.webp` | `applications_page_1793400527318.png`<br>`date_time_set_1793400627519.png` | **PASS** |
| **Persona B: Verify** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_b_verify_interview_1793400971439.webp` | `candidate_application_interview_details_1793401017322.png` | **PASS** |
| **Persona C: Admin** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_c_admin_1793401035120.webp` | `admin_overview_1793401074152.png`<br>`admin_applications_1793401119593.png` | **PASS** |
| **Persona A: Hire & Pay** | `file:///C:/Users/Hp/.gemini/antigravity-ide/brain/30397ec0-be4f-4255-92b8-779abd51cff4/persona_a_hired_flow_1793401163824.webp` | `hired_application_1793401253350.png`<br>`payments_page_1793401264353.png`<br>`payments_table_1793401271111.png` | **PASS** |

---

## 3. Real-Time Execution Log by Persona

### Phase 1: Persona A (Company Discovery, Registration & Job Creation)
- **Action 1.1:** Visited `http://localhost:5173/`. Verified hero section, Latin American talent value proposition, pricing link, and "Hire Talent" CTA.
- **Action 1.2:** Navigated to `/register`. Selected role "Hiring Company". Filled form: Name "Hiring Manager QA", Company "Northstar Technologies QA", Email `qa_employer_northstar@hirevoxa.internal`. Submitted.
- **Action 1.3:** Authenticated and redirected to `/app`. Verified Employer Dashboard metrics and empty state cards.
- **Action 1.4:** Navigated to `/app/jobs`. Clicked "Post New Job". Filled title "Full-Stack Software Engineer", department "Engineering", remote arrangement, skills (JavaScript, TypeScript, React, Node.js, Express, MongoDB, REST APIs, Git), budget "$60,000 - $80,000 USD".
- **Action 1.5:** Submitted job. Verified job appeared in jobs table with status **Open** and ID `6ae50d935437539d4378b865`.

### Phase 2: Persona B (Candidate Registration, Profile & Job Application)
- **Action 2.1:** Navigated to `/register`. Selected role "Candidate". Filled form: Name "Alex Morgan QA", Email `qa_candidate_alexmorgan@hirevoxa.internal`.
- **Action 2.2:** Authenticated and redirected to `/candidate`. Verified Candidate Dashboard.
- **Action 2.3:** Navigated to `/candidate/profile`. Updated title "Full-Stack Software Engineer", seniority "Mid-Level", hourly rate "45", timezone "UTC-5 / EST overlap", skills (JavaScript, TypeScript, React, Node.js, Express, MongoDB, REST APIs, Git), experience 2 years. Saved profile and confirmed 100% completeness.
- **Action 2.4:** Navigated to `/candidate/jobs`. Searched and located "Full-Stack Software Engineer" at "Northstar Technologies QA".
- **Action 2.5:** Opened job details. Entered cover note: *"I am excited to apply for the Full-Stack Software Engineer role at Northstar Technologies QA..."*. Clicked "Submit application".
- **Action 2.6:** Verified confirmation: *"Your application was submitted and is now tracked in your workspace."* Confirmed tracking at `/candidate/applications` with status **Submitted** and ID `6ae51ad65437539d4378ba46`.

### Phase 3: Persona A (Application Review & Interview Scheduling)
- **Action 3.1:** Logged in as Northstar Technologies QA at `/login`.
- **Action 3.2:** Navigated to `/app/applications`. Verified Alex Morgan QA's application was present in the company pipeline.
- **Action 3.3:** Opened application detail modal. Transitioned status from `Submitted` &rarr; `Shortlisted` &rarr; `Interview`.
- **Action 3.4:** Scheduled interview for November 10, 2026 at 14:00 UTC with round "System Architecture (60m)" and interviewer "Lead Architect".
- **Action 3.5:** Navigated to `/app/calendar`. Verified interview event rendered on calendar grid.

### Phase 4: Persona B (Candidate Verification of Status & Interview)
- **Action 4.1:** Logged in as Alex Morgan QA.
- **Action 4.2:** Navigated to `/candidate/applications`. Confirmed status badge updated to **Interview**.
- **Action 4.3:** Opened `/candidate/applications/6ae51ad65437539d4378ba46`. Verified scheduled interview details (11/10/2026, 2:00:00 PM EST, "Lead Architect", "Pending").

### Phase 5: Persona C (Platform Administrator Marketplace Oversight)
- **Action 5.1:** Logged in as Platform Administrator (`qa_admin_ops@hirevoxa.internal`).
- **Action 5.2:** Visited `/admin`. Confirmed aggregated platform metrics.
- **Action 5.3:** Visited `/admin/users`. Verified both "Hiring Manager QA" and "Alex Morgan QA" were present.
- **Action 5.4:** Visited `/admin/companies`. Verified "Northstar Technologies QA" was active.
- **Action 5.5:** Visited `/admin/jobs`. Verified "Full-Stack Software Engineer" was moderated and listed.
- **Action 5.6:** Visited `/admin/applications`. Verified application `6ae51ad65437539d4378ba46` in status `Interview`.
- **Action 5.7:** Visited `/admin/audit-logs`. Confirmed immutable audit trail.
- **Action 5.8:** Visited `/admin/billing`. Confirmed $2,500 placement fee structure.

### Phase 6: Persona A (Offer Extension, Hiring & Placement Generation)
- **Action 6.1:** Logged in as Northstar Technologies QA.
- **Action 6.2:** Navigated to `/app/applications`.
- **Action 6.3:** Extended offer to Alex Morgan QA: status &rarr; **Offered**.
- **Action 6.4:** Marked as hired: status &rarr; **Hired**.
- **Action 6.5:** Navigated to `/app/payments`. Verified placement fee record `PLF-2026-C1BCA46B` generated for $2,500.00 with 90-day replacement guarantee tracking.
