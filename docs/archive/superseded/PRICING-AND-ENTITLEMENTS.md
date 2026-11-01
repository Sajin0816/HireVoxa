# HIREVOXA — PRICING AND ENTITLEMENTS SPECIFICATION

**Document Version:** 1.0.0<br>
**Effective Date:** 2026-10-30<br>
**Governing Configuration:** `server/src/config/pricing.js` & `GET /api/pricing`<br>
**Monetary Standard:** Integer Minor Units (Cents, USD) — Zero Floating-Point Arithmetic

---

## 1. Plan Overview Matrix

| Plan Tier | Price (USD) | Billing Cycle | Active Jobs Limit | Search & Matching Tier | Team Seats | CSV Export | Target Audience |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Candidate Free Forever** | **$0.00** | Free Forever | N/A (Applies) | Candidate Discovery | 1 | No | Latin American Software Engineers |
| **Employer Starter** | **$0.00** | Evaluation Pilot | **5 Active Jobs** | Standard Search | 2 | No | Prospective US Hiring Teams |
| **Employer Pro** | **$199.00** *(19,900¢)* | Monthly | **50 Active Jobs** | Advanced Filters | 10 | **Yes** | Growth-Stage Tech Organizations |
| **Successful Placement** | **$2,500.00** *(250,000¢)* | Per Confirmed Hire | N/A | Success Milestone | N/A | **Yes** | Hiring Companies (Per Contract) |

---

## 2. Detailed Tier Specifications

### A. Candidate Free Forever ($0)
- **Monetary Charge:** $0.00 USD. Candidates are never charged to register, apply, interview, or receive job offers.
- **Entitlements:**
  - Create and edit full software engineering profile.
  - Upload PDF/DOCX resumes (authenticated virus scan & privacy protection).
  - Search and filter published open US software engineering requisitions.
  - Submit direct 1-click job applications with optional cover notes.
  - Real-time application tracker (Submitted → Under Review → Shortlisted → Interview → Offered → Hired).
  - Participate in interview scheduling with timezone auto-calibration.
  - Direct messaging with prospective employers.
- **Restrictions:**
  - Cannot publish job requisitions or access company candidate search tools.

### B. Employer Starter — Free Pilot ($0 to Start)
- **Monetary Charge:** $0.00 USD during initial evaluation pilot.
- **Pilot Limit:** Up to **5 active open job requisitions** simultaneously.
- **Onboarding Requirements:** Zero credit card or banking details required to evaluate.
- **Entitlements:**
  - Company profile and recruiter workspace access.
  - Core candidate discovery across Latin American engineering hubs.
  - Applicant pipeline management and stage transitions.
  - Integrated interview coordination.
  - Up to 2 recruiter team seats.
- **Restrictions (Enforced on Server):**
  - Attempting to publish a 6th active requisition returns `403 Forbidden` (`code: 'PILOT_LIMIT_REACHED'`).
  - Advanced search filters (seniority, compensation, multi-filter query) restricted.
  - CSV reporting exports restricted to Pro tier.

### C. Employer Pro Subscription ($199 / Month)
- **Monetary Charge:** USD $199.00 / month (19,900 cents in integer minor units).
- **Billing Interval:** 30 calendar days (monthly recurring).
- **Entitlements:**
  - **50 active open job requisitions** capacity.
  - **Advanced Candidate Discovery:** Multi-filter queries, minimum years of experience, compensation expectations, timezone overlap requirements, availability.
  - **Saved Searches & Talent Shortlists:** Save candidate profiles into targeted talent benches.
  - **Team Collaboration:** Multi-seat recruiter management up to 10 authorized members.
  - **Operational Analytics & CSV Export:** Downloadable candidate and requisition metrics.
  - **Priority Matching Support.**
- **Lifecycle & Cancellation:**
  - States: `pending`, `active`, `past_due`, `cancelled`, `expired`.
  - Self-serve cancellation via Recruiter Billing Hub (`/app/payments`).
  - Cancellation takes effect at period end (`cancelAtPeriodEnd: true`); recruiter retains Pro entitlements through the paid cycle.

### D. Successful Placement Fee ($2,500 Per Placement)
- **Monetary Charge:** USD $2,500.00 (250,000 cents in integer minor units) per qualifying hire.
- **Contractual Trigger Event:** Triggered strictly when an authorized recruiter moves an application to `'Hired'` (`Application.status === 'Hired'`).
- **Idempotency Guarantee:** Keyed by unique application identifier (`applicationId`). Multiple calls or re-evaluations cannot produce duplicate placement fee records.
- **90-Day Replacement Guarantee:**
  - Every qualifying placement includes a mandatory 90-day replacement guarantee window.
  - If the hired engineer departs or underperforms within 90 calendar days, the placement fee is eligible for replacement search credit or fee waiver.
- **Billing Lifecycle:**
  `not_eligible` → `eligible` → `invoiced` → `paid` (or `waived` / `disputed`).
- **Payment Terms:** Official Net-14 invoicing. Invoicing is decoupled from immediate card capture.

---

## 3. Server-Side Entitlement Middleware

All limits and access permissions are authoritatively enforced on the Node.js/Express backend:
- `server/src/middleware/entitlementMiddleware.js`
  - `checkJobPostingLimit`: Queries active open job count (`status === 'Open'`) for the authenticated company. If active jobs >= plan limit (5 for Starter, 50 for Pro), blocks creation with `403` before database insertion.
  - `requireProTier`: Enforces Pro-only features on sensitive routes.
- `server/src/services/placementBillingService.js`
  - Automatically records placement records upon verified application hiring milestones.
  - Idempotently prevents duplicate fee records for the same candidate and requisition.
