# HIREVOXA — BILLING OPERATIONS RUNBOOK

**Document Purpose:** Operational guidance for managing subscriptions, placement fees, payment reconciliation, disputes, and payment gateway configuration.<br>
**Scope:** Phase 5 Monetization Engine & Enterprise Billing Operations<br>
**Audience:** Platform Operations Admins, Finance & Billing Teams, Engineering Leads

---

## 1. Environment & Configuration Prerequisites

### Server-Side Environment Variables (`server/.env`)
The following configuration keys control monetization behavior:

```bash
# Core Configuration
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=https://hirevoxa.com

# Persistence
MONGODB_URI=mongodb+srv://<user>:<password>@hirevoxa-cluster.uvzqbhj.mongodb.net/hirevoxa?retryWrites=true&w=majority
ALLOW_IN_MEMORY_DEMO=false
ALLOW_DEMO_SEED=false

# Billing & Monetization Gateway Configuration
BILLING_PROVIDER=stripe # or test_mode
BILLING_WEBHOOK_SECRET=whsec_your_stripe_webhook_signing_secret
STRIPE_SECRET_KEY=sk_live_your_authoritative_server_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_public_key
```

> **Security Rule:** Never place secret API keys or payment tokens in client-side bundles or repository commits. Ensure `server/.env` is listed in `.gitignore`.

---

## 2. Subscription Lifecycle Management (Employer Pro $199/Month)

### A. Subscription States
1. **`pending`**: Checkout session initiated, waiting for webhook confirmation.
2. **`active`**: Verified payment processed. Employer Pro entitlements granted (50 active jobs, advanced search, CSV exports).
3. **`past_due`**: Provider renewal payment failed. Grace period active (3 days).
4. **`cancelled`**: User or admin initiated cancellation. `cancelAtPeriodEnd: true` retains access until the current 30-day period expires.
5. **`expired`**: Subscription period ended without renewal. Account automatically reverts to Employer Starter pilot (5 active jobs limit).

### B. Handling Webhook Events
All payment provider callbacks must be delivered to:<br>
`POST /api/billing/webhook`

Required verification steps:
1. **Signature Validation:** Verify `x-hirevoxa-signature` or `stripe-signature` header using the backend `BILLING_WEBHOOK_SECRET`.
2. **Idempotency Enforcement:** Backend tracks processed event IDs (`processedWebhookEvents`) to prevent duplicate subscription activations or duplicate invoices upon webhook retries.
3. **Event Handlers:**
   - `checkout.session.completed`: Upgrades company to `pro`.
   - `invoice.payment_succeeded`: Issues itemized invoice record with status `'paid'`.
   - `customer.subscription.deleted`: Reverts company plan to `'starter'`.

---

## 3. Placement Fee Lifecycle ($2,500 Qualifying Hire)

### A. Lifecycle State Machine
```
[Application 'Hired'] ──> [status: 'eligible']
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [Admin: Generate Invoice]             [Admin: Waive Fee]
   (status: 'invoiced', Net-14)          (status: 'waived', audit note)
            │
            ▼
   [Payment Reconciled]
   (status: 'paid', paymentReference)
            │
            ▼
   [90-Day Guarantee Active]
   (If departure occurs: status -> 'disputed' / 'waived')
```

### B. Operational Workflows

#### 1. Verifying Qualifying Placements
- When an application status moves to `'Hired'` in `/app/applications`, the backend automatically calls `triggerHiringPlacementFee()`.
- The system validates that no prior placement fee exists for this `applicationId` (idempotency check).
- A placement fee record is logged with:
  - Fee amount: `$2,500.00 USD` (250,000 cents)
  - Status: `'eligible'`
  - 90-Day Replacement Guarantee: Calculated as `Date.now() + 90 days`.

#### 2. Generating Net-14 Invoices
- In the Admin Panel (`/admin/billing`), locate the placement record.
- Click **Generate Invoice**.
- The system generates an official invoice number (`INV-YYYY-XXXX`) with Net-14 payment terms, itemized line items, and updates the placement status to `'invoiced'`.

#### 3. Reconciling Payment
- If payment is received via card: The recruiter clicks **Pay Placement Fee** in `/app/payments`, which validates payment and updates status to `'paid'` with an audit receipt reference.
- If payment is received via corporate bank wire: The admin records payment reference in the admin console. Status moves to `'paid'`.

#### 4. Handling 90-Day Guarantee Disputes & Waivers
- If an engineer departs or fails performance benchmarks within the 90-day window:
  - **Dispute:** Click **Dispute** in `/admin/billing`. Provide detailed documentation. The placement enters `'disputed'` status, and billing collection is paused during review.
  - **Waiver:** If an executive waiver or credit is approved, click **Waive** in `/admin/billing`. A documented reason (minimum 5 characters) is required and saved permanently in the immutable audit log.

---

## 4. Financial Reconciliation & Safety Protocols

1. **Integer Minor Units:** All financial arithmetic is performed in integer cents (e.g., $2,500 = `250000`, $199 = `19900`). Floating-point mathematics is strictly prohibited.
2. **Tenant Isolation:** A company user can only view and pay their own organization's placement fees and subscriptions. Cross-tenant access attempts return `403 Forbidden`.
3. **Audit Trail Immutability:** Financial status changes (`eligible`, `invoiced`, `paid`, `waived`, `disputed`) push structured entries to `auditTrail` containing timestamp, actor ID, action type, and reason. Existing audit entries cannot be deleted or modified.
4. **CSV Export Audit:** Authorized administrators can export the complete placement and revenue ledger via `GET /api/admin/billing/export`.
