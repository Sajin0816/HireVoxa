# Demo Data, Fallback Accounts & Profile Image Production Audit

**Document ID:** `docs/PRODUCTION/FINAL_RELEASE_AUDIT/DEMO_DATA_AND_PROFILE_IMAGE_AUDIT.md`<br>
**Audit Date:** November 1, 2026<br>
**Auditor:** Independent Production Release Auditor & Lead Frontend Architect

---

## 1. Audit Scope & Operating Rules

In accordance with Phase 8 rules:
1. Inspect the entire production experience for demo accounts, hardcoded identities, fake profile photos, hardcoded metrics, and shortcuts.
2. Replace default human profile pictures with neutral initials-based avatars.
3. Preserve brand assets and empty-state illustrations.
4. Show real database metrics.
5. Never delete existing Atlas records without explicit approval.

---

## 2. Findings & Actions Taken

### 2.1 Profile Image Cleanup (Action Completed)
- **Vulnerability / Non-Compliance Found:**
  - `HeaderProfile.jsx`: Line 18 defaulted `avatar` to an Unsplash photograph of a human model (`photo-1535713875002-d1d0cf377fde`) when no profile avatar was uploaded.
  - `RecommendationHero.jsx`: Line 86 defaulted `candidate.avatarUrl` to an Unsplash photo (`photo-1534528741775-53994a69daeb`).
- **Remediation Implemented:**
  - Updated `HeaderProfile.jsx` to render an initials badge (`getInitials()`) with the user's initials in a sleek, neutral dark badge with an active status dot.
  - Updated `RecommendationHero.jsx` to render a neutral initials badge whenever `candidate.avatarUrl` is absent.
  - Brand logos (`/images/hirevoxa-logo.png`) and SVG illustrations were fully preserved.

### 2.2 Demo Login Shortcuts Audit
- **Inspection Finding:**
  - In `LoginPage.jsx`, quick demo buttons (*"Hiring Manager"* and *"LatAm Engineer"*) are strictly guarded:
    ```jsx
    {import.meta.env.VITE_ALLOW_DEMO_LOGIN === 'true' && ( ... )}
    ```
  - In standard production builds, `VITE_ALLOW_DEMO_LOGIN` is undefined/false, so these demo buttons are completely hidden from production visitors.
  - In `AuthContext.jsx`, initial authentication state is strictly derived from verified tokens or `null`; automatic sign-in as Richard Feynman has been completely eradicated.

### 2.3 Seed Data Isolation & Provenance
- `server/src/seed/seedData.js`:
  - Every fixture record includes explicit provenance: `isDemoRecord: true`.
  - The seeder script (`server/src/seed/seed.js`) guards against execution when `ALLOW_DEMO_SEED !== 'true'`.
  - In production mode, seeding is disabled by default to prevent accidental data overwrites.

---

## 3. MongoDB Atlas Canary Test Record Inventory

During the live audit, disposable synthetic canary records were created to verify marketplace functionality:

| Collection | Canary Identifier | Record Description | Creation Purpose |
|---|---|---|---|
| `users` | `audit_admin_2026@hirevoxa.internal` | Platform Owner Admin | Persona C Verification |
| `users` | `audit_company_2026@synthetic-hirevoxa.test` | Employer Account (Audit Tech Corp) | Persona A Verification |
| `users` | `carlos.silva@synthetic-hirevoxa.test` | Candidate Account (Carlos Silva) | Persona B Verification |
| `jobs` | `Senior Full-Stack Engineer (Audited)` | Active Job Requisition | Requisition Verification |
| `applications` | `6ae631c91b377fdc9968939e` | Job Application (Status: Hired) | E2E Workflow Verification |
| `interviews` | `6ae632901b377fdc99689401` | Technical Screen Interview | Interview Scheduling Verification |
| `placementfees` | `PLF-2026-92280B52` | $2,500 Placement Fee Record | Monetization Trigger Verification |

---

## 4. Production Database Cleanup Proposal

In strict compliance with Operating Rule 7 (*"Never delete existing Atlas records without explicit approval"*), the above synthetic canary records were left in Atlas for inspection.

### Recommended Launch Cleanup Action:
When client approval is received to perform a final pre-launch purge:
1. Delete only records matching `@synthetic-hirevoxa.test` and `@hirevoxa.internal` canary emails.
2. Remove the associated canary job `Senior Full-Stack Engineer (Audited)`.
3. Retain legitimate seed catalogs or launch accounts.
4. **Approval Required:** User must explicitly approve the execution of this cleanup command before launch.
