# Hirevoxa — Company / Hiring Manager Persona Test Report

**Persona:** Company / Hiring Manager<br>
**Entity:** Northstar Technologies QA<br>
**Contact:** Hiring Manager QA (`qa_employer_northstar@hirevoxa.internal`)<br>
**Assessment Date:** 2026-10-31<br>
**Auditor:** Senior QA Automation Engineer & Product Quality Auditor

---

## 1. Scope of Assessment

This report details the full end-to-end evaluation of the Employer experience on the live Hirevoxa platform, from initial discovery and registration to candidate review, interview scheduling, calendar management, hiring transitions, and commercial fee handling.

---

## 2. Test Execution Breakdown

### 2.1 Public Discovery & Registration
- **Homepage (`/`):** Evaluated brand value proposition (*"Hire Vetted Latin American Engineering Talent"*). Clicked "Hire Talent" CTA; routed directly to `/register`.
- **Role Selection:** Selected "Hiring Company". Form inputs dynamically adjusted to request company name and work email.
- **Account Creation:** Submitted valid credentials. Session cookie issued via `Set-Cookie` (`hirevoxa_session`, HttpOnly, SameSite=Lax).
- **Redirection:** Cleanly redirected to `/app` (Employer Dashboard).

### 2.2 Employer Dashboard (`/app`)
- **Metrics Cards:** Displayed real-time aggregations: Active Jobs, Candidates in Pipeline, Scheduled Interviews, and Total Placements.
- **Navigation Shell:** Sidebar navigation (*Overview, Recommended, Jobs, Applications, Talents, Interviews, Calendar, Messages, Payments, Reports, Settings*) operated with active route highlighting.

### 2.3 Job Requisition Lifecycle (`/app/jobs`)
- **Creation Flow:** Clicked "Post New Job". Form opened with full schema fields:
  - Title: *Full-Stack Software Engineer*
  - Department: *Engineering*
  - Location: *Remote - Latin America*
  - Employment Type: *Full-Time*
  - Experience Required: *2 years*
  - Required Skills: *JavaScript, TypeScript, React, Node.js, Express, MongoDB, REST APIs, Git*
  - Compensation: *$60,000 - $80,000 USD*
- **Persistence:** Created job `6ae50d935437539d4378b865` in MongoDB Atlas with status `Open`. Job rendered in real time on the `/app/jobs` list.
- **Refresh Verification:** Refreshed browser; job remained listed with all attributes intact.

### 2.4 Candidate Discovery & Matching (`/app/talents`)
- **Talent Directory:** Explored vetted Latin American engineers. Filtered by skills (*React, TypeScript, Node.js*).
- **Match Computation:** Deterministic match algorithm scored candidate skill alignment against open company positions.
- **Shortlisting:** Bookmark action updated employer-specific shortlist store without altering global candidate visibility.

### 2.5 Application Pipeline (`/app/applications`)
- **Inbox Receipt:** Received application `6ae51ad65437539d4378ba46` from Alex Morgan QA.
- **Status Progression:**
  1. `Submitted` &rarr; `Shortlisted` (Application reviewed)
  2. `Shortlisted` &rarr; `Interview` (Interview scheduling initiated)
  3. `Interview` &rarr; `Offered` (Formal offer extended)
  4. `Offered` &rarr; `Hired` (Hiring finalized)

### 2.6 Interview Scheduling & Calendar (`/app/interviews` & `/app/calendar`)
- **Scheduling Modal:** Configured date (*2026-11-10*), time (*14:00 EST*), round (*System Architecture (60m)*), and interviewer (*Lead Architect*).
- **Calendar Integration:** Verified event marker rendered on the monthly day cell. Prev/Next navigation traversed month boundaries accurately.

### 2.7 Placement Fee & Billing (`/app/payments`)
- **Trigger Verification:** Upon transitioning application to `Hired`, the placement fee engine automatically created record `PLF-2026-C1BCA46B` amounting to **$2,500.00** with a 90-day guarantee period.
- **Payments Table:** Rendered placement fee in `/app/payments` with candidate name, position, amount, status (*eligible*), and guarantee expiration.

---

## 3. Results Summary

| Feature | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Employer Registration | Create user & company records | Created user `6ae50cfc5437539d4378b840` | **PASS** |
| Employer Dashboard | Load workspace metrics | Displayed active pipeline counts | **PASS** |
| Job Creation | Save job requisition to Atlas | Saved job `6ae50d935437539d4378b865` | **PASS** |
| Application Review | Display candidate applications | Rendered Alex Morgan QA application | **PASS** |
| Status Progression | Move Submitted &rarr; Shortlisted &rarr; Interview | Updated application and history | **PASS** |
| Interview Scheduling | Create interview and sync calendar | Scheduled interview `6ae520675437539d4378ba90` | **PASS** |
| Offer & Hire | Transition to Offered & Hired | Status `Hired` verified in Atlas | **PASS** |
| Placement Billing | Generate $2,500 placement fee | Generated `PLF-2026-C1BCA46B` ($2,500) | **PASS** |
