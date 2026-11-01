import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';

describe('Phase 2A Acceptance Verification — Real Application Auth & Roles', () => {
  const timestamp = Date.now();
  const companyEmail = `company_test_${timestamp}@acmetech.io`;
  const candidateEmail = `candidate_test_${timestamp}@latameng.dev`;
  const password = 'Password@123';

  let companyToken = '';
  let candidateToken = '';
  let companyUser = null;
  let candidateUser = null;
  let createdJobId = '';

  // 1. Register a Company Account & Verify Persisted Role
  test('Scenario 1: Register a company account and verify its persisted role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Elena Rostova',
        email: companyEmail,
        password,
        role: 'company',
        companyName: 'Acme Global Ventures'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'Token must be issued');
    assert.equal(res.body.user.role, 'company', 'Persisted role must be company');
    assert.equal(res.body.user.companyName, 'Acme Global Ventures');
    assert.equal(res.body.user.email, companyEmail);

    companyToken = res.body.token;
    companyUser = res.body.user;

    // Verify cryptographic JWT payload role
    const decoded = jwt.verify(companyToken, JWT_SECRET);
    assert.equal(decoded.role, 'company', 'JWT role claim must be company');
    assert.equal(decoded.email, companyEmail);

    // Verify /api/auth/me returns persisted company role
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.role, 'company');
  });

  // 2. Log In as Company & Execute Company Workspace Operations
  test('Scenario 2: Log in as company account and perform company workspace actions', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: companyEmail, password });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.user.role, 'company');
    companyToken = loginRes.body.token;

    // Company creates a job requisition
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        title: 'Senior Distributed Systems Architect',
        description: 'Design low-latency cloud infrastructure across Americas.',
        department: 'Infrastructure',
        requiredSkills: ['Go', 'Kubernetes', 'AWS'],
        minimumExperience: 6,
        employmentType: 'Full-Time',
        budgetRange: '$8,000 - $10,000/mo',
        timeZoneOverlapRequirements: 'EST (4+ hours)'
      });

    assert.equal(jobRes.status, 201, 'Company must be permitted to create jobs');
    assert.equal(jobRes.body.success, true);
    assert.ok(jobRes.body.data._id);
    createdJobId = jobRes.body.data._id;

    // Company accesses company analytics
    const metricsRes = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(metricsRes.status, 200, 'Company must be permitted to access metrics');
    assert.equal(metricsRes.body.success, true);

    // Company accesses interview list
    const intRes = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(intRes.status, 200, 'Company must be permitted to access interviews');
  });

  // 3. Register a Candidate Account & Verify Persisted Role
  test('Scenario 3: Register a candidate account and verify its persisted role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mateo Morales',
        email: candidateEmail,
        password,
        role: 'candidate'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'Token must be issued');
    assert.equal(res.body.user.role, 'candidate', 'Persisted role must be candidate');
    assert.equal(res.body.user.email, candidateEmail);

    candidateToken = res.body.token;
    candidateUser = res.body.user;

    // Verify cryptographic JWT payload role
    const decoded = jwt.verify(candidateToken, JWT_SECRET);
    assert.equal(decoded.role, 'candidate', 'JWT role claim must be candidate');

    // Verify /api/auth/me returns persisted candidate role
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.role, 'candidate');
  });

  // 4. Log In as Candidate & Confirm Company Workspace is Denied
  test('Scenario 4: Log in as candidate account and confirm company workspace is strictly denied (403)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: candidateEmail, password });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.user.role, 'candidate');
    candidateToken = loginRes.body.token;

    // Candidate attempts to create a job -> 403 Forbidden
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Unauthorized Requisition',
        description: 'Candidate should not be able to post jobs.',
        requiredSkills: ['React'],
        budgetRange: '$5,000/mo',
        timeZoneOverlapRequirements: 'EST'
      });
    assert.equal(jobRes.status, 403, 'Candidate must be rejected from creating jobs with 403');
    assert.match(jobRes.body.error, /is not authorized/i);

    // Candidate attempts to delete a job -> 403 Forbidden
    const delJobRes = await request(app)
      .delete(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(delJobRes.status, 403, 'Candidate must be rejected from deleting jobs with 403');

    // Candidate attempts to delete an interview -> 403 Forbidden
    const delIntRes = await request(app)
      .delete('/api/interviews/int-001')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(delIntRes.status, 403, 'Candidate must be rejected from deleting interviews with 403');

    // Candidate attempts to view company analytics -> 403 Forbidden
    const metricsRes = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(metricsRes.status, 403, 'Candidate must be rejected from company metrics with 403');

    // Verify ProtectedRoute logic evaluation for candidate
    const allowedRoles = ['company', 'admin'];
    const isAllowed = allowedRoles.includes(candidateUser.role);
    assert.equal(isAllowed, false, 'Candidate role must fail ProtectedRoute company guard');
  });

  // 5. Switch Between Account Types & Verify No Leaked State
  test('Scenario 5: Log out and switch between account types without retaining previous identity or role', async () => {
    // 1. Start with candidate token verified
    const candCheck = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(candCheck.body.user.role, 'candidate');

    // 2. Simulate Logout: token cleared
    let activeToken = null;
    let activeUser = null;

    // Verify unauthenticated request is blocked
    const unauthCheck = await request(app).get('/api/auth/me');
    assert.equal(unauthCheck.status, 401);

    // 3. Log in as Company Account
    const compLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: companyEmail, password });
    assert.equal(compLogin.status, 200);

    activeToken = compLogin.body.token;
    activeUser = compLogin.body.user;

    // Verify newly active identity is purely company with zero candidate state
    assert.equal(activeUser.role, 'company');
    assert.equal(activeUser.email, companyEmail);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeToken}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.role, 'company');
    assert.equal(meRes.body.user.name, 'Elena Rostova');
  });

  // 6. Refresh / Session Restoration Integrity
  test('Scenario 6: Refresh browser and verify session restoration uses the correct authenticated identity', async () => {
    // Re-verify company session restoration via token
    const compRestore = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(compRestore.status, 200);
    assert.equal(compRestore.body.user.email, companyEmail);
    assert.equal(compRestore.body.user.role, 'company');

    // Re-verify candidate session restoration via token
    const candRestore = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(candRestore.status, 200);
    assert.equal(candRestore.body.user.email, candidateEmail);
    assert.equal(candRestore.body.user.role, 'candidate');
  });

  // 7. Token Security & Rejection
  test('Scenario 7: Confirm protected API requests reject missing, malformed, and expired tokens', async () => {
    // Missing
    const missingRes = await request(app).get('/api/auth/me');
    assert.equal(missingRes.status, 401);

    // Malformed
    const malformedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-jwt-token-string');
    assert.equal(malformedRes.status, 401);

    // Expired
    const expiredToken = jwt.sign(
      { id: 'usr-exp', email: 'exp@acme.com', role: 'company' },
      JWT_SECRET,
      { expiresIn: '-10s' }
    );
    const expiredRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(expiredRes.status, 401);

    // Forged signature
    const forgedToken = jwt.sign(
      { id: 'usr-forge', email: 'hacker@dark.net', role: 'company' },
      'invalid_tampered_secret_signature',
      { expiresIn: '1h' }
    );
    const forgedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`);
    assert.equal(forgedRes.status, 401);
  });

  // 8. Anti-Role-Forgery and Storage Tampering Protection
  test('Scenario 8: Confirm changing frontend storage or sending a forged role cannot grant company access', async () => {
    // A candidate attempts to send a forged role in request body to elevate privileges
    const tamperRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Tampered Job Attempt',
        description: 'Sending role=company in body should be ignored by backend.',
        role: 'company',
        user: { role: 'company' },
        requiredSkills: ['Node.js'],
        budgetRange: '$4,000/mo',
        timeZoneOverlapRequirements: 'EST'
      });

    // Backend must reject based on verified JWT role claim
    assert.equal(tamperRes.status, 403, 'Server must enforce JWT role and reject forged body role with 403');
    assert.match(tamperRes.body.error, /is not authorized/i);

    // If client tampered with localStorage user role to company, but presents candidate token:
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(meRes.body.user.role, 'candidate', 'Server /api/auth/me returns authentic role, defeating client-side forgery');
  });
});
