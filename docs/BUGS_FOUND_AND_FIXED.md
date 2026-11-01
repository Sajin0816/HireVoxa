# Hirevoxa — Bugs Found & Fixed (Self-Healing Log)

During the live browser and database testing session on 2026-10-31, three genuine software defects were discovered through live execution, diagnosed to their root causes, remediated with surgical code edits, and verified through both browser retesting and automated regression suites.

---

## Bug Index

| Bug ID | Component | Severity | Description | Status |
|---|---|---|---|---|
| **BUG-01** | Frontend (`PricingPage.jsx`) | **Medium** | `ReferenceError: setLoading is not defined` crashes pricing view on load | **FIXED & VERIFIED** |
| **BUG-02** | Backend Script (`bootstrapAdmin.js`) | **Medium** | Enum mismatch on `AuditLog.create` causes validation exception during admin creation | **FIXED & VERIFIED** |
| **BUG-03** | Backend Script (`bootstrapAdmin.js`) | **High** | Double password hashing prevents bootstrapped admin from logging into Admin Portal | **FIXED & VERIFIED** |

---

## Detailed Defect Reports

### BUG-01: `ReferenceError: setLoading is not defined` in `PricingPage.jsx`

#### 1. Reproduction Steps
1. Open the live browser and navigate to `http://localhost:5173/pricing`.
2. Observe browser console during component mount.
3. Observe page fails to complete rendering and throws unhandled runtime exception.

#### 2. Captured Evidence
- **Console Output:**
  ```text
  ReferenceError: setLoading is not defined
      at http://localhost:5173/src/pages/PricingPage.jsx:26:5
  ```
- **Recording:** `public_site_audit_1793392305593.webp`

#### 3. Root Cause Analysis
In `client/src/pages/PricingPage.jsx`, the `useEffect` hook included a `finally` block calling `setLoading(false)`, but the component had only declared:
```javascript
const [pricingData, setPricingData] = useState(null);
const [openFaq, setOpenFaq] = useState(null);
```
The state variable `[loading, setLoading]` was missing, causing a runtime reference exception whenever pricing data finished loading from the backend API.

#### 4. Fix Applied
In `client/src/pages/PricingPage.jsx`:
```javascript
const [pricingData, setPricingData] = useState(null);
const [loading, setLoading] = useState(true);
const [openFaq, setOpenFaq] = useState(null);
```

#### 5. Verification & Retest
- Navigated back to `http://localhost:5173/pricing` in live browser.
- Page loaded instantaneously with all 4 commercial tiers ($0 Candidate, $0 Starter, $2,500 Placement, $199 Pro).
- Zero console errors reported.

---

### BUG-02: `AuditLog validation failed` Enum Mismatch in `bootstrapAdmin.js`

#### 1. Reproduction Steps
1. Execute `node src/scripts/bootstrapAdmin.js --email qa_admin_audit@hirevoxa.internal --name "QA Admin Auditor" --password "AdminPassword#2026!"`.
2. Inspect terminal output.

#### 2. Captured Evidence
- **Terminal Error Output:**
  ```text
  [Bootstrap ERROR] AuditLog validation failed:
  targetType: `SYSTEM` is not a valid enum value for path `targetType`.,
  outcome: `SUCCESS` is not a valid enum value for path `outcome`.
  ```

#### 3. Root Cause Analysis
In `server/src/models/AuditLog.js`, the schema defines:
```javascript
targetType: {
  type: String,
  enum: ['User', 'Company', 'Job', 'Application', 'Interview', 'Setting', 'Support', 'System']
},
outcome: {
  type: String,
  enum: ['success', 'failure']
}
```
`server/src/scripts/bootstrapAdmin.js` was passing uppercase strings `'SYSTEM'` and `'SUCCESS'` rather than `'System'` and `'success'`, violating Mongoose schema validation.

#### 4. Fix Applied
In `server/src/scripts/bootstrapAdmin.js`:
```javascript
await AuditLog.create({
  actorId: 'CLI_BOOTSTRAP',
  actorEmail: email,
  actorRole: 'owner',
  action: 'ADMIN_BOOTSTRAP',
  targetType: 'System',
  targetId: user._id.toString(),
  outcome: 'success',
  details: { name }
});
```

#### 5. Verification & Retest
- Reran bootstrap command.
- Atlas record written successfully without validation errors.

---

### BUG-03: Double Password Hashing in `bootstrapAdmin.js`

#### 1. Reproduction Steps
1. Provision admin via `bootstrapAdmin.js`.
2. Navigate to `http://localhost:5173/login`.
3. Submit email `qa_admin_audit@hirevoxa.internal` and password `AdminPassword#2026!`.
4. Observe login rejection: "Invalid email or password".

#### 2. Captured Evidence
- **Browser Subagent Log:**
  ```text
  POST http://localhost:5000/api/auth/login 401 (Unauthorized)
  Invalid email or password
  ```
- **Recording:** `admin_full_journey_1793394010143.webp`

#### 3. Root Cause Analysis
In `server/src/models/User.js`:
```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```
The `User` model automatically hashes plain-text passwords on `pre('save')`. However, `bootstrapAdmin.js` was manually hashing the password with bcrypt *before* calling `User.create({ password: hashedPassword })`, causing Mongoose to hash the already-hashed string a second time. When the user entered `AdminPassword#2026!` at `/login`, `bcrypt.compare` failed against the doubly-hashed value.

#### 4. Fix Applied
In `server/src/scripts/bootstrapAdmin.js`:
```javascript
// For MongoDB mode, pass unhashed password so Mongoose pre-save hook handles hashing once
user.password = password;
// ...
user = await User.create({
  name,
  email,
  password,
  role: 'admin',
  adminRole: 'owner',
  status: 'active',
  companyName: 'Hirevoxa Ops',
  companyId: ''
});
```

#### 5. Verification & Retest
- Updated test admin password with single-hash hook.
- Navigated to `http://localhost:5173/login` in the live browser.
- Entered admin credentials; authenticated immediately and redirected to `/admin` dashboard.
- Verified all admin sub-pages (`/admin/users`, `/admin/companies`, `/admin/jobs`, `/admin/billing`, `/admin/audit-logs`).
- Recording: `admin_audit_verification_1793394197781.webp`.
