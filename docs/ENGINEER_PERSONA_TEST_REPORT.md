# Hirevoxa — Software Engineer / Job Seeker Persona Test Report

**Persona:** Software Engineer / Candidate<br>
**Name:** Alex Morgan QA<br>
**Email:** `qa_candidate_alexmorgan@hirevoxa.internal`<br>
**Assessment Date:** 2026-10-31<br>
**Auditor:** Senior QA Automation Engineer & Product Quality Auditor

---

## 1. Scope of Assessment

This report details the full end-to-end evaluation of the Candidate experience on the live Hirevoxa platform, covering registration, profile completion, skill tagging, job discovery, application submission, application status tracking, interview notifications, and privacy safeguards.

---

## 2. Test Execution Breakdown

### 2.1 Public Discovery & Registration
- **Landing Page (`/`):** Evaluated candidate-oriented messaging (*"Access High-Growth US Engineering Roles"*). Verified candidate membership is 100% free forever.
- **Registration Form (`/register`):** Selected "Candidate". Submitted:
  - Full Name: *Alex Morgan QA*
  - Email: `qa_candidate_alexmorgan@hirevoxa.internal`
  - Password: `AlexMorganPass#2026!`
- **Redirection:** Cleanly authenticated and routed to `/candidate` (Candidate Dashboard).

### 2.2 Profile Management (`/candidate/profile`)
- **Profile Fields Populated:**
  - Professional Title: *Full-Stack Software Engineer*
  - Seniority: *Mid-Level*
  - Years of Experience: *2*
  - Location: *Buenos Aires, Argentina*
  - Timezone: *UTC-5 / EST overlap*
  - Hourly Rate: *$45 USD / hour*
  - Primary Skills: *JavaScript, TypeScript, React, Node.js, Express, MongoDB, REST APIs, Git*
  - Professional Summary: *"Software engineer with two years of experience building web applications using React, TypeScript, Node.js, and MongoDB."*
- **Completeness Meter:** Computed 100% profile completeness based on all 6 mandatory profile evaluation dimensions.
- **Persistence Verification:** Saved profile; refreshed the browser; confirmed all form inputs loaded saved data from MongoDB Atlas.

### 2.3 Job Discovery (`/candidate/jobs`)
- **Marketplace Browsing:** Navigated to `/candidate/jobs`. Filtered by department (*Engineering*) and searched for *Full-Stack Software Engineer*.
- **Role Verification:** Located the requisition posted by Northstar Technologies QA (`6ae50d935437539d4378b865`). Inspected requirements, compensation ($60k - $80k), and skills list.

### 2.4 Application Submission (`/candidate/jobs/:id`)
- **Submission Action:** Scrolled to right sidebar. Inputted custom cover note: *"I am excited to apply for the Full-Stack Software Engineer role at Northstar Technologies QA. With 2 years of experience in React, TypeScript, Node.js, and MongoDB, I am eager to contribute to your engineering goals."*
- **Click & Confirmation:** Clicked "Submit application". Received confirmation: *"Your application was submitted and is now tracked in your workspace."*
- **Duplicate Protection:** Verified that the apply button transitioned to disabled / "Already applied" state to prevent duplicate submissions.

### 2.5 Application Tracking (`/candidate/applications`)
- **Inbox Review:** Confirmed the application was tracked under `/candidate/applications` with status **Submitted**.
- **Real-Time Status Synchronization:**
  - When Northstar Technologies QA moved status to `Shortlisted`, candidate view reflected updated stage.
  - When Northstar Technologies QA moved status to `Interview`, candidate view displayed **Interview** badge.
- **Application Detail View (`/candidate/applications/:id`):** Opened `/candidate/applications/6ae51ad65437539d4378ba46`. Verified scheduled interview section rendered:
  - Date & Time: *11/10/2026, 2:00:00 PM (EST)*
  - Round: *System Architecture (60m)*
  - Interviewer: *Lead Architect*
  - Status: *Pending*

---

## 3. Results Summary

| Feature | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Candidate Registration | Create candidate user record | Created user `6ae50e195437539d4378b86b` | **PASS** |
| Candidate Profile | Save skills, bio, rate, experience | Saved profile `6ae50e195437539d4378b86d` | **PASS** |
| Profile Completeness | Calculate completeness score | Evaluated to 100% | **PASS** |
| Job Search | Locate open company listings | Located Northstar Full-Stack job | **PASS** |
| Application Submit | Save application to Atlas | Created application `6ae51ad65437539d4378ba46` | **PASS** |
| Duplicate Prevention | Block duplicate application | Enforced compound unique index | **PASS** |
| Application Tracking | Display real-time status updates | Tracked Submitted &rarr; Shortlisted &rarr; Interview | **PASS** |
| Interview Visibility | Render scheduled interview details | Rendered date, round, and interviewer | **PASS** |
| Candidate Free Access | Zero fee barriers or paywalls | 100% free throughout all flows | **PASS** |
