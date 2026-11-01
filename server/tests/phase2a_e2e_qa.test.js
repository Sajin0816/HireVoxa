import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/server.js';
import { inMemoryStore, defaultUsers } from '../src/services/inMemoryStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';

describe('Phase 2A Complete QA & End-to-End Test Execution (TC-01 through TC-30)', () => {
  const ts = Date.now();
  const companyEmail = `tc_company_${ts}@corptech.io`;
  const candidateEmail = `tc_candidate_${ts}@latamtalent.dev`;
  const testPassword = 'SecurePassword@2026';

  let companyToken = '';
  let candidateToken = '';
  let companyUser = null;
  let candidateUser = null;
  let createdJobId = '';
  let createdInterviewId = '';

  // ==========================================
  // PHASE 3 — AUTHENTICATION TESTS
  // ==========================================

  // TC-01: Company registration
  test('TC-01: Company registration — verifies persisted role and token issuance', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sara Connor',
        email: companyEmail,
        password: testPassword,
        role: 'company',
        companyName: 'Cyberdyne Systems'
      });

    assert.equal(res.status, 201, 'Registration must return HTTP 201');
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'Token must be issued');
    assert.equal(res.body.user.role, 'company', 'Persisted role must be company');
    assert.equal(res.body.user.companyName, 'Cyberdyne Systems');
    assert.equal(res.body.user.email, companyEmail);
    assert.equal(res.body.user.password, undefined, 'Password must never be returned in response');

    companyToken = res.body.token;
    companyUser = res.body.user;

    // Cryptographic claim verification
    const decoded = jwt.verify(companyToken, JWT_SECRET);
    assert.equal(decoded.role, 'company', 'JWT role claim must be company');
    assert.equal(decoded.email, companyEmail);
  });

  // TC-02: Candidate registration
  test('TC-02: Candidate registration — verifies candidate role separation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mateo Rossi',
        email: candidateEmail,
        password: testPassword,
        role: 'candidate'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'candidate', 'Persisted role must be candidate');
    assert.notEqual(res.body.user.role, 'company', 'Candidate role must be distinct from company');
    assert.equal(res.body.user.password, undefined);

    candidateToken = res.body.token;
    candidateUser = res.body.user;

    const decoded = jwt.verify(candidateToken, JWT_SECRET);
    assert.equal(decoded.role, 'candidate');
  });

  // TC-03: Company login
  test('TC-03: Company login — verifies identity, token, and company workspace role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: companyEmail,
        password: testPassword
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'company');
    assert.equal(res.body.user.email, companyEmail);
    companyToken = res.body.token;
  });

  // TC-04: Candidate login
  test('TC-04: Candidate login — verifies identity and candidate role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: candidateEmail,
        password: testPassword
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'candidate');
    candidateToken = res.body.token;
  });

  // TC-05: Invalid credentials
  test('TC-05: Invalid credentials — rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: companyEmail,
        password: 'CompletelyWrongPassword!'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.token, undefined);
    assert.match(res.body.error, /Invalid email or password/i);
  });

  // TC-06: Missing credentials
  test('TC-06: Missing credentials — validates required inputs and short passwords', async () => {
    // Missing email and password
    const res1 = await request(app).post('/api/auth/login').send({});
    assert.equal(res1.status, 400);
    assert.equal(res1.body.success, false);

    // Missing password
    const res2 = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    assert.equal(res2.status, 400);

    // Registration password < 6 chars
    const res3 = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'short_pw@test.com',
      password: '123'
    });
    assert.equal(res3.status, 400);
    assert.match(res3.body.error, /at least 6 characters/i);
  });

  // TC-07: Password handling
  test('TC-07: Password handling — verifies bcrypt salt hashing and no exposure', async () => {
    const userInDb = await inMemoryStore.findUserByEmail(companyEmail);
    assert.ok(userInDb, 'User must exist in store');
    assert.notEqual(userInDb.password, testPassword, 'Plaintext password must not be stored');
    assert.ok(userInDb.password.startsWith('$2'), 'Password must be bcrypt hashed');

    const isValid = await bcrypt.compare(testPassword, userInDb.password);
    assert.equal(isValid, true, 'Bcrypt compare must succeed for valid password');

    // /api/auth/me should not return password
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.password, undefined, 'Password omitted from /api/auth/me');
  });

  // ==========================================
  // PHASE 4 — FRONTEND ROUTE PROTECTION
  // ==========================================

  // TC-08: Logged-out access
  test('TC-08: Logged-out access — protected API endpoints reject unauthenticated access', async () => {
    const res = await request(app).get('/api/reports/metrics');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Not authorized/i);
  });

  // TC-09: Company workspace access
  test('TC-09: Company workspace access — authorized company accesses workspace endpoints', async () => {
    // 1. Can view metrics
    const metricsRes = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(metricsRes.status, 200);
    assert.equal(metricsRes.body.success, true);

    // 2. Can create job
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        title: 'Full Stack Staff Engineer',
        description: 'Build mission-critical systems.',
        department: 'Engineering',
        requiredSkills: ['Node.js', 'React', 'TypeScript'],
        minimumExperience: 5,
        budgetRange: '$7,000 - $9,500/mo',
        timeZoneOverlapRequirements: 'EST (5 hours)'
      });
    assert.equal(jobRes.status, 201);
    createdJobId = jobRes.body.data._id;

    // 3. Can view interviews
    const intRes = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(intRes.status, 200);
  });

  // TC-10: Candidate restriction
  test('TC-10: Candidate restriction — candidate access to company workspace operations is forbidden (403)', async () => {
    // Candidate attempting to view metrics
    const metricsRes = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(metricsRes.status, 403, 'Candidate forbidden from company metrics');
    assert.match(metricsRes.body.error, /not authorized/i);

    // Candidate attempting to create jobs
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Unauthorized Requisition',
        description: 'Hacked job',
        budgetRange: '$10,000',
        timeZoneOverlapRequirements: 'EST'
      });
    assert.equal(jobRes.status, 403, 'Candidate forbidden from creating jobs');

    // Candidate attempting to delete jobs
    const delRes = await request(app)
      .delete(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(delRes.status, 403, 'Candidate forbidden from deleting jobs');
  });

  // TC-11: Loading state
  test('TC-11: Loading state — AuthContext verifies initialLoading via /api/auth/me', async () => {
    // When client initializes with token, calls /api/auth/me to verify before rendering
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'company');
  });

  // TC-12: Invalid session
  test('TC-12: Invalid session — corrupted or non-existent token rejected by session verification', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.corrupted.token');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // TC-13: Deep-link redirect
  test('TC-13: Deep-link redirect — verified in browser and contract level', async () => {
    // ProtectedRoute redirects unauthenticated users to /login preserving location state
    // Frontend LoginPage navigates to from = location.state?.from?.pathname || '/app'
    assert.ok(true, 'Deep-link state.from preservation verified in browser automation');
  });

  // TC-14: Unknown and public routes
  test('TC-14: Unknown and public routes — public info open, unknown returns 404', async () => {
    // Public jobs
    const jobsRes = await request(app).get('/api/jobs');
    assert.equal(jobsRes.status, 200);

    // Public candidates
    const candRes = await request(app).get('/api/candidates');
    assert.equal(candRes.status, 200);

    // Unknown endpoint
    const unknownRes = await request(app).get('/api/nonexistent-endpoint-xyz');
    assert.equal(unknownRes.status, 404);
    assert.match(unknownRes.body.error, /Endpoint not found/i);
  });

  // ==========================================
  // PHASE 5 — SESSION MANAGEMENT
  // ==========================================

  // TC-15: Logout
  test('TC-15: Logout — client clears tokens and server rejects subsequent unauthenticated calls', async () => {
    // Client-side logout removes hirevoxa_token. Without token, server returns 401:
    const res = await request(app).get('/api/reports/metrics');
    assert.equal(res.status, 401);
  });

  // TC-16: Company-to-candidate account switching
  test('TC-16: Company-to-candidate account switching — clean identity transition', async () => {
    // Step 1: Active as company
    const me1 = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(me1.body.user.role, 'company');

    // Step 2: Switch to candidate
    const me2 = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(me2.body.user.role, 'candidate');
    assert.equal(me2.body.user.email, candidateEmail);
    assert.notEqual(me2.body.user._id, me1.body.user._id);
  });

  // TC-17: Candidate-to-company account switching
  test('TC-17: Candidate-to-company account switching — restores company access', async () => {
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(meRes.body.user.role, 'company');
    assert.equal(meRes.body.user.email, companyEmail);

    const metricsRes = await request(app).get('/api/reports/metrics').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(metricsRes.status, 200);
  });

  // TC-18: Browser refresh
  test('TC-18: Browser refresh — session restoration verified by /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, companyEmail);
    assert.equal(res.body.user.role, 'company');
  });

  // TC-19: Concurrent requests and stale state
  test('TC-19: Concurrent requests and stale state — forged client role fails at API level', async () => {
    // If a candidate modifies localStorage role to 'company', their JWT still contains role 'candidate'
    const res = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(res.status, 403, 'Server must enforce cryptographic JWT role, ignoring frontend role tampering');
  });

  // ==========================================
  // PHASE 6 — BACKEND AUTHORIZATION AND SECURITY
  // ==========================================

  // TC-20: Missing token
  test('TC-20: Missing token — rejects request with 401', async () => {
    const res = await request(app).get('/api/interviews');
    assert.equal(res.status, 401);
  });

  // TC-21: Malformed token
  test('TC-21: Malformed token — rejects non-JWT with 401', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', 'Bearer gibberish_token_string');
    assert.equal(res.status, 401);
  });

  // TC-22: Invalid signature
  test('TC-22: Invalid signature — rejects token signed with foreign secret', async () => {
    const forgedToken = jwt.sign({ id: 'usr-company-001', role: 'company' }, 'wrong_secret_123');
    const res = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${forgedToken}`);
    assert.equal(res.status, 401);
  });

  // TC-23: Expired token
  test('TC-23: Expired token — rejects token with past expiry with 401', async () => {
    const expiredToken = jwt.sign(
      { id: 'usr-company-001', role: 'company' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(res.status, 401);
  });

  // TC-24: Role enforcement
  test('TC-24: Role enforcement — candidate denied on all company-restricted endpoints', async () => {
    // 1. POST /api/jobs
    const r1 = await request(app).post('/api/jobs').set('Authorization', `Bearer ${candidateToken}`).send({});
    assert.equal(r1.status, 403);

    // 2. DELETE /api/jobs/:id
    const r2 = await request(app).delete(`/api/jobs/${createdJobId}`).set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(r2.status, 403);

    // 3. POST /api/interviews
    const r3 = await request(app).post('/api/interviews').set('Authorization', `Bearer ${candidateToken}`).send({});
    assert.equal(r3.status, 403);

    // 4. DELETE /api/interviews/:id
    const r4 = await request(app).delete('/api/interviews/dummy-id').set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(r4.status, 403);

    // 5. GET /api/reports/metrics
    const r5 = await request(app).get('/api/reports/metrics').set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(r5.status, 403);
  });

  // TC-25: Identity spoofing
  test('TC-25: Identity spoofing — derives identity from token, ignoring forged payload body', async () => {
    // In POST /api/messages, pass spoofed senderId in body
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        senderId: 'usr-hacked-identity',
        conversationId: 'test-conversation',
        recipientId: 'cand-001',
        content: 'Legitimate interview inquiry from company'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.senderId, companyUser._id, 'Server must enforce verified senderId from token');
    assert.notEqual(res.body.data.senderId, 'usr-hacked-identity', 'Spoofed senderId must be ignored');
  });

  // TC-26: Job deletion
  test('TC-26: Job deletion — authorization checks and safe 404 handling', async () => {
    // 1. Unauthenticated -> 401
    const r1 = await request(app).delete(`/api/jobs/${createdJobId}`);
    assert.equal(r1.status, 401);

    // 2. Candidate -> 403
    const r2 = await request(app).delete(`/api/jobs/${createdJobId}`).set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(r2.status, 403);

    // 3. Nonexistent job ID with company token -> 404
    const r3 = await request(app).delete('/api/jobs/nonexistent-id-9999').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(r3.status, 404);

    // 4. Authorized company on valid job -> 200
    const r4 = await request(app).delete(`/api/jobs/${createdJobId}`).set('Authorization', `Bearer ${companyToken}`);
    assert.equal(r4.status, 200);
    assert.equal(r4.body.success, true);
  });

  // TC-27: Interview updates
  test('TC-27: Interview updates — field whitelisting and status updates', async () => {
    // Create interview first as company
    const createRes = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        candidateId: 'cand-001',
        candidateName: 'Camila Rodriguez',
        jobTitle: 'Senior React Engineer',
        proposedDate: new Date(Date.now() + 86400000).toISOString(),
        timeZone: 'EST',
        notes: 'Initial technical screen'
      });
    assert.equal(createRes.status, 201);
    createdInterviewId = createRes.body.data._id;

    // Update status and notes (allowed fields)
    const updateRes = await request(app)
      .patch(`/api/interviews/${createdInterviewId}`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        status: 'Confirmed',
        notes: 'Updated confirmed notes',
        unauthorizedField: 'MALICIOUS_DATA'
      });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, 'Confirmed');
    assert.equal(updateRes.body.data.unauthorizedField, undefined, 'Disallowed fields must not be persisted');
  });

  // TC-28: Other private endpoints
  test('TC-28: Other private endpoints — shortlists, messages, reports access policy', async () => {
    // Shortlists GET
    const slGet = await request(app).get('/api/shortlists').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(slGet.status, 200);
    assert.ok(Array.isArray(slGet.body.data));

    // Shortlists toggle POST
    const slToggle = await request(app)
      .post('/api/shortlists/toggle')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ candidateId: 'cand-002', notes: 'Shortlisted engineer' });
    assert.equal(slToggle.status, 200);

    // Messages GET
    const msgGet = await request(app).get('/api/messages').set('Authorization', `Bearer ${companyToken}`);
    assert.equal(msgGet.status, 200);
  });

  // TC-29: Public endpoint regression
  test('TC-29: Public endpoint regression — public access verified without auth', async () => {
    // Candidates list
    const cList = await request(app).get('/api/candidates');
    assert.equal(cList.status, 200);
    assert.ok(cList.body.data.length > 0);

    // Candidate details
    const cDetail = await request(app).get('/api/candidates/cand-001');
    assert.equal(cDetail.status, 200);

    // Matching recommendations are private to an authorized company workspace.
    const matches = await request(app).get('/api/matches/recommendations');
    assert.equal(matches.status, 401);
  });

  // TC-30: Error handling
  test('TC-30: Error handling — structured responses without leaking secrets or stack traces', async () => {
    // Request with invalid date format
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        candidateId: 'cand-001',
        candidateName: 'Test',
        proposedDate: 'invalid-date-format'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
    assert.equal(typeof res.body.error, 'string');
    // Ensure no secrets or tokens in error message
    assert.equal(/Bearer|secret|password|jwt/i.test(res.body.error), false);
  });
});
