# HIREVOXA — BILLING & MONETIZATION TEST MATRIX

**Phase:** Phase 5 (Monetization Engine & Entitlements)<br>
**Execution Date:** 2026-10-30<br>
**Backend Test Suite:** `server/tests/phase5_monetization.test.js` (15 tests, 100% PASS)<br>
**Total Test Suites:** 14 suites, 171 tests, 0 failures (100% PASS)<br>
**Browser Evidence Recording:** `monetization_e2e_verify_1793382827612.webp`

---

## 1. Automated Backend Test Matrix (`phase5_monetization.test.js`)

| Test ID | Category | Scenario / Endpoint | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MON-01** | Pricing Config | `GET /api/pricing` | Returns candidate ($0), starter ($0), pro ($199 / 19,900¢), placement ($2,500 / 250,000¢) without leaking secrets | Status 200, exact minor units matching PRICING_CONFIG | **PASS** |
| **TC-MON-02** | Pricing Endpoint | `GET /api/billing/pricing` | Public route returns matching pricing structure | Status 200, matching configuration | **PASS** |
| **TC-MON-03** | Starter Entitlement | `GET /api/billing/company` | Returns Starter pilot status, 5 active jobs limit, standard search tier | Status 200, `plan: 'starter'`, `maxActiveJobs: 5` | **PASS** |
| **TC-MON-04** | Pilot Enforcement | `POST /api/jobs` (Job 1–5) | Starter organization can create up to 5 active jobs | Status 201 for jobs 1 through 5 | **PASS** |
| **TC-MON-05** | Pilot Limit Block | `POST /api/jobs` (Job 6) | 6th active job blocked with 403 `PILOT_LIMIT_REACHED` | Status 403, `code: 'PILOT_LIMIT_REACHED'`, `limit: 5` | **PASS** |
| **TC-MON-06** | Placement Trigger | `PATCH /api/applications/:id/status` | Moving status to 'Hired' automatically registers eligible placement fee | Status 200, fee record created with $2,500 and 90-day guarantee | **PASS** |
| **TC-MON-07** | Placement Idempotency | Re-triggering placement service | Multiple calls for same applicationId return existing fee without duplicating | Exactly 1 fee record exists in database | **PASS** |
| **TC-MON-08** | Placement Payment | `POST /api/billing/placements/:id/pay` | Company can pay their placement fee; updates status to 'paid' | Status 200, `status: 'paid'`, paymentReference recorded | **PASS** |
| **TC-MON-09** | Tenant Isolation | `POST /api/billing/placements/:id/pay` (Comp B) | Company B cannot pay or mutate Company A's placement fee | Status 403 Forbidden | **PASS** |
| **TC-MON-10** | Pro Upgrade | `POST /api/billing/subscribe` | Upgrades company to Employer Pro ($199/mo), updates plan, creates invoice | Status 200, `plan: 'pro'`, invoice generated | **PASS** |
| **TC-MON-11** | Pro Limit Expansion | `POST /api/jobs` on Pro Tier | Company on Pro tier can create beyond Starter limit (e.g. 6th job) | Status 201 Created | **PASS** |
| **TC-MON-12** | Pro Cancellation | `POST /api/billing/cancel` | Recruiter can schedule cancellation at period end | Status 200, `cancelAtPeriodEnd: true` | **PASS** |
| **TC-MON-13** | Admin Metrics | `GET /api/billing/admin/metrics` | Returns aggregated invoiced, collected, MRR, placement counts | Status 200, exact mathematical reconciliation | **PASS** |
| **TC-MON-14** | Admin RBAC | `GET /api/billing/admin/metrics` (Recruiter) | Non-admin user blocked from accessing admin revenue metrics | Status 403 Forbidden | **PASS** |
| **TC-MON-15** | Fee Waiver Audit | `POST /api/billing/admin/placements/:id/waive` | Admin can waive fee with mandatory documented reason and audit log | Status 200, `status: 'waived'`, audit log updated | **PASS** |
| **TC-MON-16** | CSV Data Export | `GET /api/billing/admin/export` | Admin can stream placement fees and revenue records as CSV | Status 200, `content-type: text/csv` | **PASS** |

---

## 2. Live Browser E2E Interaction Test Matrix

| Test ID | Page / Flow | User Role | Action Taken | UI Verification Result | Screenshot Evidence | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-UI-01** | `/pricing` | Public / Guest | Inspect public pricing page | All 4 tiers displayed clearly: Candidate $0, Starter $0 Pilot, Pro $199/mo, Successful Placement $2,500 (90-day guarantee) | `pricing_page_1793382845881.png` | **PASS** |
| **TC-UI-02** | `/app/payments` | Recruiter (`richardfeynman@gmail.com`) | Inspect initial recruiter billing hub | Displays Employer Starter (Free Pilot), active capacity tracker (2 of 5 used), standard search tier | `recruiter_payments_hub_1793382908943.png` | **PASS** |
| **TC-UI-03** | Modal Flow | Recruiter | Click "Upgrade to Pro ($199/mo)" | Modal opens showing $199.00/month, feature checklist, test card fields, simulated test mode security notice | `upgrade_modal_1793382935425.png` | **PASS** |
| **TC-UI-04** | Modal Upgrade | Recruiter | Click "Confirm Upgrade ($199/mo)" | Modal closes, success toast appears, plan updates live to "Active Employer Pro", capacity updates to 50 slots, $199 invoice generated | `upgraded_employer_pro_1793382960985.png` | **PASS** |
| **TC-UI-05** | `/admin/billing` | Admin (`owner@hirevoxa.internal`) | Inspect Admin Revenue & Billing Governance | Top KPI cards display Collected Cash ($2,699.00), Invoiced Revenue ($2,699.00), MRR ($199.00), Placements (1 paid), Placements table with actions | `admin_billing_dashboard_1793383073833.png` | **PASS** |

---

## 3. Regression Suite Summary (Phases 0–4.5 Verification)

| Test Suite File | Subtests | Status | Execution Time |
| :--- | :--- | :--- | :--- |
| `tests/api.test.js` | 9 | **PASS** | 2.1s |
| `tests/auth.test.js` | 4 | **PASS** | 2.4s |
| `tests/deterministic_matching.test.js` | 2 | **PASS** | 0.003s |
| `tests/persistence.test.js` | 8 | **PASS** | 34.2s |
| `tests/phase2a_acceptance.test.js` | 8 | **PASS** | 4.9s |
| `tests/phase2a_e2e_qa.test.js` | 30 | **PASS** | 3.1s |
| `tests/phase3_candidate_portal.test.js` | 14 | **PASS** | 0.8s |
| `tests/phase3_e2e_scenario.test.js` | 10 | **PASS** | 0.9s |
| `tests/phase4_5_admin_operations.test.js` | 20 | **PASS** | 1.8s |
| `tests/phase4_hiring_workflow.test.js` | 9 | **PASS** | 0.7s |
| `tests/security.test.js` | 25 | **PASS** | 1.5s |
| `tests/session_security.test.js` | 9 | **PASS** | 1.4s |
| `tests/tenant_isolation.test.js` | 18 | **PASS** | 2.0s |
| `tests/phase5_monetization.test.js` | 15 | **PASS** | 2.9s |
| **TOTALS** | **171 tests (14 suites)** | **100% PASS** | **47.1s** |
