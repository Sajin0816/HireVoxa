# Monetization Engine & Placement Billing Final Verification

**Document ID:** `docs/PRODUCTION/FINAL_RELEASE_AUDIT/MONETIZATION_FINAL_VERIFICATION.md`<br>
**Audit Date:** November 1, 2026<br>
**Auditor:** Principal Software Architect & Financial Systems Auditor

---

## 1. Commercial Model Architecture Overview

Hirevoxa implements a dual-tier commercial monetization model:
1. **Candidate:** 100% Free Forever.
2. **Employer Starter (Pilot):** $0 subscription with pilot capacity limits (up to 5 active job requisitions).
3. **Employer Pro:** $199.00 USD / month subscription for scaling recruitment teams (up to 50 active requisitions).
4. **Successful Placement Fee:** $2,500.00 USD triggered upon verified candidate hire, backed by a 90-day replacement guarantee.

---

## 2. Plan Entitlements & Capacity Enforcement

### 2.1 Candidate Free Guarantee
- Verified that candidates are never prompted for payment information during registration, profile management, resume upload, job applications, or interview scheduling.
- Backend schema enforces `feeForCandidate: 0`.

### 2.2 Employer Starter 5-Job Limit Verification
- **Configuration:** Centrally configured in `server/src/config/pricing.js`:
  ```javascript
  EMPLOYER_STARTER: {
    tier: 'starter',
    priceCents: 0,
    limits: {
      maxActiveJobs: 5,
      candidateSearchTier: 'standard'
    }
  }
  ```
- **Enforcement:** `server/src/middleware/entitlementMiddleware.js` (`checkJobPostingLimit`) intercepts `POST /api/jobs`:
  - Counts active `Open` requisitions for the employer tenant.
  - If count >= 5, returns HTTP 403 Forbidden with code `PILOT_LIMIT_REACHED` and upgrade prompt.

### 2.3 Successful Placement Fee Domain Logic
- **Trigger Event:** Application state transition to `status: 'Hired'` in `server/src/controllers/applicationController.js`.
- **Contractual Guarantees:**
  - Standard Placement Fee: **$2,500.00 USD** (`feeAmountCents: 250000`).
  - Guarantee Period: **90 calendar days** from date of hire (`replacementGuaranteeExpiry`).
  - Terms Version: `HVX-TOS-2026-V1`.
- **Duplicate Prevention:** Before creating a placement fee record, the domain service checks for existing placement records matching `(companyId, candidateId, jobId)`. Multiple transitions to `Hired` cannot spawn duplicate placement invoices.
- **Settlement Mode:** Manual enterprise invoicing / bank wire. Verified via `/app/payments` invoice record.

---

## 3. Stripe Integration Assessment

### **STATUS: BLOCKED (Awaiting Production Credentials)**

- **Current State:**
  - Stripe SDK integration exists in `billingController.js` and `placementBillingService.js`.
  - Live card charges and real-time webhook updates require live production API keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
  - Automated recurring card charging is safely disabled in the production environment.
- **Audit Decision:**
  - Hirevoxa is **authorized to launch** under the Employer Starter pilot model with manual enterprise placement invoicing.
  - Automated card transactions remain blocked until merchant credentials, legal terms, and webhook signatures are configured.
