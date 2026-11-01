# Hirevoxa — Monetization, Pricing & Billing Operations

**Document Version:** 2.0.0<br>
**Location:** `docs/MONETIZATION.md`<br>
**Governing Engine:** `server/src/config/pricing.js`, `billingController.js`, `billingRoutes.js`<br>
**Monetary Standard:** Integer Minor Units (Cents, USD) — Zero Floating-Point Arithmetic

---

## 1. Plan Overview Matrix

| Plan Tier | Price (USD) | Minor Units (Cents) | Billing Cycle | Active Jobs Limit | Search & Matching Tier | Team Seats | CSV Export | Target Audience |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Candidate Free Forever** | **$0.00** | 0¢ | Free Forever | N/A (Applies) | Candidate Discovery | 1 | No | Latin American Software Engineers |
| **Employer Starter** | **$0.00** | 0¢ | Evaluation Pilot | **5 Active Jobs** | Standard Search | 2 | No | Prospective US Hiring Teams |
| **Employer Pro** | **$199.00** | 19,900¢ | Monthly Recurring | **50 Active Jobs** | Advanced Filters | 10 | **Yes** | Growth-Stage Tech Organizations |
| **Successful Placement** | **$2,500.00** | 250,000¢ | Per Confirmed Hire | N/A | Milestone Placement | N/A | **Yes** | Hiring Companies (Per Contract) |

---

## 2. Detailed Tier Specifications

### A. Candidate Free Forever ($0)
- **Monetary Charge:** $0.00 USD. Candidates are never charged to register, apply, interview, or receive job offers.
- **Entitlements:**
  - Create and edit full software engineering profile.
  - Upload PDF resumes with authenticated privacy protection.
  - Search and filter published open US software engineering requisitions.
  - Submit direct 1-click job applications with custom cover notes.
  - Real-time application tracker (Submitted &rarr; Under Review &rarr; Shortlisted &rarr; Interview &rarr; Offered &rarr; Hired).
  - Participate in interview scheduling with automatic timezone calculation.
- **Restrictions:**
  - Cannot publish job requisitions or access company candidate search tools.

### B. Employer Starter — Free Pilot ($0 to Start)
- **Monetary Charge:** $0.00 USD during initial evaluation pilot. Zero credit card required to evaluate.
- **Pilot Limit:** Up to **5 active open job requisitions** simultaneously.
- **Entitlements:**
  - Company profile and recruiter workspace access.
  - Core candidate discovery across Latin American engineering hubs.
  - Applicant pipeline management and stage transitions.
  - Integrated interview coordination.
  - Up to 2 recruiter team seats.
- **Restrictions (Enforced on Server):**
  - Attempting to publish a 6th active requisition returns `403 Forbidden` (`code: 'PILOT_LIMIT_REACHED'`).
  - Advanced search filters restricted.
  - CSV reporting exports restricted to Pro tier.

### C. Employer Pro Subscription ($199 / Month)
- **Monetary Charge:** USD $199.00 / month (19,900 cents).
- **Billing Interval:** 30 calendar days (monthly recurring).
- **Entitlements:**
  - **50 active open job requisitions** capacity.
  - **Advanced Candidate Discovery:** Multi-filter queries, minimum experience, compensation expectations, timezone overlap requirements, availability.
  - **Saved Searches & Talent Shortlists:** Save candidate profiles into targeted talent benches.
  - **Team Collaboration:** Multi-seat recruiter management up to 10 authorized members.
  - **Operational Analytics & CSV Export:** Downloadable candidate and requisition metrics.
  - **Priority Matching Support.**

### D. Successful Placement Fee ($2,500)
- **Trigger Event:** Application stage transition to `'Hired'` by an authorized company recruiter.
- **Monetary Charge:** USD $2,500.00 (250,000 cents in integer minor units).
- **Lifecycle:**
  1. Automated invoice generation upon `'Hired'` milestone.
  2. Status set to `due` with 14-day payment grace period.
  3. Receipt and PDF invoice dispatch.

---

## 3. Billing Operations & Gateway Webhooks

### Webhook Delivery Endpoint
`POST /api/billing/webhook`

### Security & Idempotency Rules
1. **Signature Verification:** Every webhook payload must be signed by the provider (`x-hirevoxa-signature` or `stripe-signature`) using the server secret `BILLING_WEBHOOK_SECRET`.
2. **Idempotency Tracking:** Backend stores processed event IDs in database to prevent duplicate charges or double activations upon gateway retries.
3. **Refunds & Disputes:**
   - Handled exclusively through Platform Owner role in Operations Admin (`/admin/billing`).
   - Placement fee refund within 90 days if candidate departure occurs under guarantee terms.
