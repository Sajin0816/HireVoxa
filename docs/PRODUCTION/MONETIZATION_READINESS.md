# Monetization & Payment Production Readiness Report

**Project:** Hirevoxa Recruitment Marketplace<br>
**Document ID:** `docs/PRODUCTION/MONETIZATION_READINESS.md`<br>
**Assessment Date:** October 31, 2026<br>
**Auditor Roles:** Principal Software Architect, Technical Product Manager, Billing Systems Engineer

---

## 1. Commercial Pricing Model

The Hirevoxa commercial structure is established and hardcoded within the domain configuration (`server/src/config/pricing.js`):

```javascript
module.exports = {
  CANDIDATE: {
    price: 0,
    currency: 'USD',
    description: 'Free forever. Zero application fees, zero profile paywalls.'
  },
  EMPLOYER_STARTER: {
    price: 0,
    currency: 'USD',
    tier: 'starter',
    limits: {
      activeJobs: 5,
      candidateMatchesPerJob: 10,
      teamMembers: 1,
      csvExport: false
    }
  },
  EMPLOYER_PRO: {
    price: 199,
    currency: 'USD',
    billingPeriod: 'month',
    tier: 'pro',
    limits: {
      activeJobs: 50,
      candidateMatchesPerJob: 50,
      teamMembers: 5,
      csvExport: true
    }
  },
  PLACEMENT_FEE: {
    amount: 2500,
    currency: 'USD',
    trigger: 'APPLICATION_STATUS_HIRED',
    guaranteePeriodDays: 90,
    description: 'Billed upon candidate hiring transition with a 90-day replacement guarantee.'
  }
};
```

### Commercial Principles
1. **Candidates Never Pay:** Engineers are never charged for creating profiles, uploading resumes, applying for jobs, or interviewing.
2. **Placement Fee is Decoupled from Subscriptions:** The $2,500 placement fee applies regardless of whether the employer is on the Starter ($0) or Pro ($199/mo) tier.
3. **No Unilateral Price Changes:** Pricing reflects explicit business decisions and is protected from unauthorized modification.

---

## 2. Monetization Architecture & Billing Lifecycle

```
Recruiter Pipeline               Application Controller          Placement Billing Service
       |                                   |                                   |
Candidate Hired ---------------------> PUT /applications/:id                   |
                                           |                                   |
                                           +--- Checks: previousStatus !== 'Hired'
                                           |                                   |
                                           +--- Triggers: createPlacementFee()
                                                                               |
                                                                               +---> Insert PlacementFee ($2,500)
                                                                               +---> Insert Invoice (status: pending)
                                                                               +---> Trigger Admin Billing Queue
```

### 2.1 Domain Models
- **`PlacementFee` (`server/src/models/PlacementFee.js`):**
  - Tracks `applicationId`, `candidateId`, `companyId`, `amount: 2500`, `currency: 'USD'`.
  - State machine: `pending` -> `invoiced` -> `paid` -> `disputed` -> `refunded`.
  - Records the start and end dates of the 90-day candidate guarantee.
- **`Subscription` (`server/src/models/Subscription.js`):**
  - Tracks company plan (`starter` vs `pro`), price ($0 vs $199), cycle dates, and billing status (`active`, `past_due`, `canceled`).
- **`Invoice` (`server/src/models/Invoice.js`):**
  - Itemized records for administrative and corporate tax accounting.

### 2.2 Entitlement Enforcement Middleware
- Implemented via `server/src/middleware/entitlementMiddleware.js`:
  - When an employer attempts to post a 6th active job on the Starter plan, the request is intercepted with `403 Forbidden` (`Upgrade to Employer Pro to post up to 50 active jobs`).
  - Pro-only features (e.g., CSV candidate export) reject requests from Starter organizations.

---

## 3. Payment Gateway Integration Assessment

### 3.1 Current Integration Status: **CONDITIONALLY READY / GATEWAY BLOCKED**

| Capability | Status | Implementation Detail |
|---|---|---|
| **Domain Data Modeling** | Verified | All schemas (`PlacementFee`, `Subscription`, `Invoice`) persisted in Atlas |
| **Placement Billing Trigger** | Verified | Automatic $2,500 fee creation on `Hired` status transition |
| **Entitlement Gates** | Verified | Job post limits and Pro features enforced on backend |
| **Admin Revenue Dashboard** | Verified | Administrator views total placement revenue and subscription volume |
| **Stripe Live SDK Integration** | **BLOCKED** | Live credit card processing requires production Stripe API keys |
| **Webhook Signature Verification** | Pending Live Keys | Idempotency and Stripe signature validation ready for configuration |
| **Automated Card Tokenization** | Simulated | Client UI uses demo credit card flows pending live Stripe Elements setup |

---

## 4. Production Release Requirements for Live Billing

To transition the payment gateway from simulated/mock mode to live production card processing:

1. **Stripe Merchant Account Provisioning:**
   - Establish verified Stripe US business entity account.
2. **Environment Variable Configuration:**
   - Configure `STRIPE_SECRET_KEY` (`sk_live_...`) in production secret manager.
   - Configure `STRIPE_PUBLISHABLE_KEY` (`pk_live_...`) in client `.env.production`.
   - Configure `STRIPE_WEBHOOK_SECRET` (`whsec_...`) for webhook signature verification.
3. **Webhook Endpoint Deployment:**
   - Expose `/api/billing/webhook` with raw request body parser (to verify HMAC signatures).
   - Implement event handlers for:
     - `checkout.session.completed` (Subscription activation).
     - `invoice.payment_succeeded` (Subscription renewal).
     - `invoice.payment_failed` (Grace period & suspension trigger).
     - `charge.dispute.created` (Placement fee freeze).
4. **Legal & Tax Requirements:**
   - Finalize Master Services Agreement (MSA) containing the 90-day replacement guarantee clauses for placement fees.
   - Configure Stripe Tax or automated invoice calculation.

---

## 5. Monetization Release Verdict

- **Platform Monetization Logic:** **PRODUCTION READY** (All domain rules, entitlements, triggers, and accounting schemas fully operational).
- **Live Credit Card Processing:** **BLOCKED PENDING PRODUCTION CREDENTIALS** (Recommended launch option: Launch under Starter Pilot mode with manual $2,500 wire/invoicing, followed by Stripe live gateway activation).
