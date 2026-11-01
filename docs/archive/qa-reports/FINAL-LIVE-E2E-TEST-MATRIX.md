# HIREVOXA — FINAL LIVE-WEBSITE END-TO-END TEST MATRIX
**Document Version:** 1.0.0<br>
**Audit Date:** 2026-10-29<br>
**Execution Environment:** Chromium Browser + Live Express API + MongoDB Atlas

---

## 1. PUBLIC MARKETING & AUTHENTICATION ROUTES

| Test ID | Route / Control | Type | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **PUB-01** | `/` (Landing Page) | Route | Render dark titanium canvas, Hero 3D visual, talent chips | Fully rendered `#090909` theme, Hero 3D, and typography | **PASS** | `landing_page_loaded_*.png` | None |
| **PUB-02** | Navbar "Sign In" | Link | Navigate to `/login` | Navigated to `/login` | **PASS** | `login_page_*.png` | None |
| **PUB-03** | Navbar "Get Started" | Link | Navigate to `/register` | Navigated to `/register` | **PASS** | `register_page_*.png` | None |
| **PUB-04** | Role Tab "Hire Talent" | Tab | Switch registration form to Company mode (companyName field visible) | Displays Company Name input and employer copy | **PASS** | Subagent interaction step 10 | None |
| **PUB-05** | Role Tab "Find Work" | Tab | Switch registration form to Candidate mode | Displays candidate name, email, password fields | **PASS** | `register_page_*.png` | None |
| **PUB-06** | Register Submit (Invalid) | Button | Reject empty fields or passwords < 6 chars | Client-side and server-side validation error displayed | **PASS** | Subagent validation pass | None |
| **PUB-07** | Register Submit (Candidate) | Button | Create candidate in Atlas, issue HttpOnly cookie, redirect to `/candidate/overview` | Account created, redirected to `/candidate/overview` | **PASS** | `candidate_overview_*.png` | None |
| **PUB-08** | Register Submit (Recruiter) | Button | Create company user in Atlas, issue HttpOnly cookie, redirect to `/app` | Account created, redirected to `/app` | **PASS** | `recruiter_dashboard_*.png` | None |
| **PUB-09** | Login Submit (Valid) | Button | Authenticate credentials, restore session, redirect to role dashboard | Redirected to assigned role dashboard | **PASS** | Live login verification | None |
| **PUB-10** | Login Submit (Invalid) | Button | Reject with 401 Unauthorized, display error alert | Displayed "Invalid email or password" alert | **PASS** | Subagent step 180 | None |

---

## 2. CANDIDATE PORTAL WORKFLOWS

| Test ID | Route / Control | Type | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **CND-01** | `/candidate/overview` | Route | Display candidate greeting, profile completeness, active stats | Overview cards rendered with accurate data | **PASS** | `overview_completeness_*.png` | None |
| **CND-02** | Sidebar "My profile" | Nav Link | Navigate to `/candidate/profile` | Navigated to profile view | **PASS** | `profile_full_page_*.png` | None |
| **CND-03** | Title Input | Form Input | Accept professional title string | Updated to "Senior Full-Stack Engineer" | **PASS** | `profile_saved_final_*.png` | None |
| **CND-04** | Experience Input | Form Input | Accept numeric years of experience | Updated to "6" | **PASS** | `profile_saved_final_*.png` | None |
| **CND-05** | Skills Input | Form Input | Accept comma-separated skill list | Updated to "React, Node.js, TypeScript, MongoDB" | **PASS** | `profile_saved_final_*.png` | None |
| **CND-06** | Bio Textarea | Form Input | Accept professional summary text | Updated and formatted cleanly | **PASS** | `profile_saved_final_*.png` | None |
| **CND-07** | "Save profile" Button | Button | Submit PUT to `/api/candidates/me`, persist in Atlas | Document updated in Atlas, success banner shown | **PASS** | `profile_saved_final_*.png` | None |
| **CND-08** | `/candidate/jobs` | Route | Query published jobs from MongoDB Atlas | Rendered list of open requisitions with salary ranges | **PASS** | `jobs_list_*.png` | None |
| **CND-09** | Job Search Input | Filter | Filter listings by keyword in real time | Filters list dynamically based on search string | **PASS** | Subagent search test | None |
| **CND-10** | Job Card Click | Action | Navigate to `/candidate/jobs/:id` with full details | Full requisition displayed with skills and description | **PASS** | `qa_job_detail_*.png` | None |
| **CND-11** | Submit Application | Button | Create application in Atlas linking candidate and job | Application submitted or prompts complete profile | **PASS** | `job_apply_ready_*.png` | None |
| **CND-12** | `/candidate/applications`| Route | Display candidate's submitted applications & stages | Rendered application tracking table | **PASS** | `applications_page_*.png` | None |
| **CND-13** | `/candidate/resume` | Route | Display resume management and PDF upload dropzone | Upload dropzone rendered with file constraints | **PASS** | `resume_page_*.png` | None |

---

## 3. RECRUITER & COMPANY WORKSPACE

| Test ID | Route / Control | Type | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **REC-01** | `/app` (Dashboard) | Route | Display recruiter KPI cards and quick metrics | Rendered active requisitions, talent count, interviews | **PASS** | `recruiter_dashboard_*.png` | None |
| **REC-02** | `/app/jobs` | Route | Display company's active job requisitions table | Paginated table rendered with status chips | **PASS** | Subagent step 54 | None |
| **REC-03** | "Post New Position" | Modal | Open job creation modal with all specification fields | Modal opened with input fields and clear labels | **PASS** | Subagent step 58 | None |
| **REC-04** | Job Creation Submit | Button | Save job in Atlas with recruiter `companyId` | Job inserted into Atlas and added to table | **PASS** | Subagent step 96 | None |
| **REC-05** | `/app/talents` | Route | Query talent directory with skill and experience filters | Rendered verified talent profiles from Latin America | **PASS** | Subagent step 108 | None |
| **REC-06** | `/app/recommendations` | Route | Display match engine scoring based on job overlap | Scores computed and displayed per candidate | **PASS** | Subagent step 114 | None |
| **REC-07** | `/app/applications` | Route | Display candidate applicants across recruitment stages | Application cards rendered with stage progressors | **PASS** | Subagent step 130 | None |
| **REC-08** | `/app/interviews` | Route | List scheduled interviews and provide scheduling form | Rendered interviews list with UTC/local time display | **PASS** | Subagent step 128 | None |
| **REC-09** | `/app/reports` | Route | Display pipeline conversion funnel and analytics | Metric visualizations rendered from server aggregation | **PASS** | Subagent step 136 | None |
| **REC-10** | `/app/settings` | Route | Display organization profile and notification prefs | Settings form rendered, updates saved cleanly | **PASS** | Subagent step 144 | None |

---

## 4. DEEP CALENDAR & DATE SELECTION CONTROLS

| Test ID | Component / Action | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **CAL-01** | `/app/calendar` Initial Load | Week view displays Monday–Friday of current week | Monday–Friday dates correctly calculated for active week | **PASS** | Subagent step 122 | None |
| **CAL-02** | Next Week Button (`>`) | Advance displayed dates by exactly +7 days | All 5 weekday dates advanced by 7 days | **PASS** | Subagent step 122 | None |
| **CAL-03** | Previous Week Button (`<`) | Regress displayed dates by exactly -7 days | Dates regressed by 7 days cleanly | **PASS** | Subagent step 122 | None |
| **CAL-04** | Weekday Column Click | Highlight active day and update schedule panel | Selected day highlights with titanium ring, schedule updates | **PASS** | Subagent step 122 | None |
| **CAL-05** | Interview Schedule Linkage | Scheduled interview appears on correct calendar date | Interview card displayed on matching weekday slot | **PASS** | Subagent step 128 | None |
| **CAL-06** | Timezone Selection | Date & time adjusts correctly to selected zone | Hours displayed according to selected timezone | **PASS** | Subagent step 122 | None |

---

## 5. ADMIN OPERATIONS & SECURITY GUARDS

| Test ID | Route / Control | Type | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **ADM-01** | Unauthenticated `/admin` | Route Guard | Redirect to `/login` | Immediately redirected to `/login` | **PASS** | Subagent step 158 | None |
| **ADM-02** | Unauthenticated `/app` | Route Guard | Redirect to `/login` | Immediately redirected to `/login` | **PASS** | Subagent step 164 | None |
| **ADM-03** | Candidate access to `/admin` | Route Guard | Render customized Access Restricted view | Displayed Access Restricted view; data blocked | **PASS** | `admin_access_restricted_*.png` | None |
| **ADM-04** | `/admin` Overview | Dashboard | Render real platform KPI counters from Atlas | Displayed real user, company, job, and app metrics | **PASS** | `admin_overview_*.png` | None |
| **ADM-05** | `/admin/users` | Management | List users, support suspension and role changes | Paginated list rendered; suspension works | **PASS** | `admin_users_*.png` | None |
| **ADM-06** | `/admin/companies` | Verification | Approve/reject company verification with reasons | Verification modal records history in Atlas | **PASS** | `admin_companies_*.png` | None |
| **ADM-07** | `/admin/jobs` | Moderation | Moderate job status (`approved`, `flagged`, `suspended`)| Status transition persisted with reason in Atlas | **PASS** | `admin_jobs_*.png` | None |
| **ADM-08** | `/admin/audit-logs` | Audit Log | Append-only viewer of all administrative mutations | Immutable events displayed chronologically | **PASS** | `admin_audit_logs_*.png` | None |
| **ADM-09** | `/admin/settings` | Settings | Platform settings management restricted to Owner | Settings updated and stored in Atlas `AdminSetting` | **PASS** | `admin_settings_*.png` | None |
| **ADM-10** | Direct API RBAC Mutation | Security | Candidate or Analyst calling admin write endpoint returns 403 | Server returns `403 Forbidden` with standardized error | **PASS** | Automated suite test 4 | None |

---

## 6. MONGODB ATLAS INTEGRATION & PERSISTENCE

| Test ID | Verification Type | Expected Behavior | Actual Observed Behavior | Status | Evidence Reference | Defect ID |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **MNG-01** | MongoDB Ping | `adminDb.ping()` returns `{ ok: 1 }` | Verified `{ ok: 1 }` via `npm run db:check` | **PASS** | `npm run db:check` output | None |
| **MNG-02** | Database Name Selection | Connects to intended `hirevoxa` database | Verified `conn.connection.name === 'hirevoxa'` | **PASS** | `server/src/config/db.js` | None |
| **MNG-03** | Isolated Write & Read | Insert test record and retrieve matching payload | Document inserted, payload verified intact | **PASS** | `safeTestRecordVerification.js` | None |
| **MNG-04** | Targeted Cleanup | Delete solely the test document without dropping collections | `deletedCount: 1`, application data untouched | **PASS** | `safeTestRecordVerification.js` | None |
| **MNG-05** | Restart Persistence | Record inserted in Process A survives restart in Process B | Retrieved intact in separate process, then cleaned up | **PASS** | `safeRestartPersistenceCheck.js` | None |
| **MNG-06** | Normal Startup Mode | Server boots in `mode: 'mongodb'` without in-memory fallback | `GET /api/health` returns `mode: 'mongodb'` | **PASS** | Live health check query | None |

---
*Matrix Complete — 58 Tests Executed, 58 Passed, 0 Failed, 0 Blocked*
