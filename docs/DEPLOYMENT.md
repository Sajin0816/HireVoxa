# Hirevoxa — Deployment & Environment Configuration Guide

**Document Version:** 2.0.0<br>
**Location:** `docs/DEPLOYMENT.md`

---

## 1. Environment Variables Specification

The platform reads server-side environment variables from [`server/.env`](file:///g:/HireVoxa/server/.env).

### Authoritative Server Configuration (`server/.env`)
```bash
# Server Runtime
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=https://hirevoxa.com

# Persistence (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@hirevoxa-cluster.uvzqbhj.mongodb.net/hirevoxa?retryWrites=true&w=majority
ALLOW_IN_MEMORY_DEMO=false
ALLOW_DEMO_SEED=false
REQUIRE_DB=true

# Security & Authentication
JWT_SECRET=your_authoritative_64_character_hex_or_base64_secret_key_here
JWT_EXPIRES_IN=7d

# Payment & Commercial Operations (Phase 5)
BILLING_PROVIDER=stripe
BILLING_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_public_publishable_key
```

### Frontend Configuration (`client/.env`)
```bash
VITE_API_BASE_URL=https://api.hirevoxa.com/api
VITE_ALLOW_DEMO_LOGIN=false
```

---

## 2. MongoDB Atlas Network Configuration

MongoDB Atlas enforces an IP Access List firewall. Incoming connections from IP addresses not in the Access List will fail during TLS handshaking with `SSL alert number 80 (tlsv1 alert internal error)`.

### Network Access Setup
1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Under **Security** in the left sidebar, click **Network Access**.
3. Click **Add IP Address**:
   - For cloud hosts (AWS/GCP/Heroku/Vercel) or dynamic development IPs: Add `0.0.0.0/0` ("Allow Access from Anywhere").
   - For dedicated static server egress: Add your server's static outbound IP (e.g., `198.51.100.24/32`).
4. Click **Confirm** and wait ~30 seconds for the status indicator to turn **Active**.

---

## 3. Provisioning the Initial Platform Owner

Public user registration with `role: 'admin'` is strictly blocked by the API (`HTTP 400 Bad Request`). The first administrator must be provisioned using the dedicated CLI tool:

```bash
npm --prefix server run bootstrap:admin
```

The script will prompt for:
- Full Name
- Corporate Email Address
- Master Password (minimum 10 characters with uppercase, lowercase, numbers, and symbols)

The script checks for existing owners, prevents duplicate root accounts, logs an audit record, and provisions the initial Platform Owner (`adminRole: 'owner'`).

---

## 4. Production Checklist

- [ ] `.env` is listed in `.gitignore` and never committed to Git.
- [ ] `ALLOW_IN_MEMORY_DEMO` is set to `false`.
- [ ] `REQUIRE_DB` is set to `true`.
- [ ] A cryptographically strong `JWT_SECRET` is configured.
- [ ] MongoDB Atlas Network Access is whitelisted.
- [ ] Database user has `readWrite` permissions on database `hirevoxa`.
- [ ] Initial Platform Owner is bootstrapped via `npm run bootstrap:admin`.
- [ ] SSL/TLS certificate is provisioned and active on reverse proxy.
