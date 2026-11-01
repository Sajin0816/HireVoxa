import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';

const companyToken = jwt.sign(
  { id: 'usr-company-sec-01', email: 'sec_company@hirevoxa.com', role: 'company', name: 'Security Lead' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const candidateToken = jwt.sign(
  { id: 'usr-cand-sec-01', email: 'sec_candidate@hirevoxa.com', role: 'candidate', name: 'Candidate Dev' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const expiredToken = jwt.sign(
  { id: 'usr-expired-01', email: 'expired@hirevoxa.com', role: 'company' },
  JWT_SECRET,
  { expiresIn: '-1s' }
);

const invalidSignatureToken = jwt.sign(
  { id: 'usr-hacker-01', email: 'hacker@darkweb.io', role: 'admin' },
  'completely_wrong_secret_signature_99999',
  { expiresIn: '1h' }
);

describe('Hirevoxa Security & Authorization Suite', () => {
  // 1. Unauthenticated Request Rejection (401)
  test('rejects unauthenticated POST /api/jobs with 401', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'Unauth Dev' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Not authorized/i);
  });

  test('rejects unauthenticated DELETE /api/jobs/:id with 401', async () => {
    const res = await request(app).delete('/api/jobs/job-001');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated GET /api/interviews with 401', async () => {
    const res = await request(app).get('/api/interviews');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated POST /api/interviews with 401', async () => {
    const res = await request(app).post('/api/interviews').send({ candidateId: 'cand-001' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated PATCH /api/interviews/:id with 401', async () => {
    const res = await request(app).patch('/api/interviews/int-001').send({ status: 'Confirmed' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated DELETE /api/interviews/:id with 401', async () => {
    const res = await request(app).delete('/api/interviews/int-001');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated GET /api/shortlists with 401', async () => {
    const res = await request(app).get('/api/shortlists');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated POST /api/shortlists/toggle with 401', async () => {
    const res = await request(app).post('/api/shortlists/toggle').send({ candidateId: 'cand-001' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated POST /api/messages with 401', async () => {
    const res = await request(app).post('/api/messages').send({ content: 'Test unauth' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects unauthenticated GET /api/reports/metrics with 401', async () => {
    const res = await request(app).get('/api/reports/metrics');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 2. Malformed, Expired, and Invalid Signature Token Rejection (401)
  test('rejects malformed token with 401', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', 'Bearer gibberish_token_string_here');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Session expired or token invalid/i);
  });

  test('rejects expired token with 401', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Session expired or token invalid/i);
  });

  test('rejects invalid signature token with 401', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${invalidSignatureToken}`);
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Session expired or token invalid/i);
  });

  // 3. Role-Based Access Control Rejection (403 Forbidden)
  test('rejects candidate attempting to POST /api/jobs with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Hacker Position',
        description: 'Should fail role check.',
        requiredSkills: ['Node.js'],
        minimumExperience: 3,
        budgetRange: '$4,000/mo',
        timeZoneOverlapRequirements: 'EST'
      });
    assert.equal(res.status, 403);
    assert.match(res.body.error, /is not authorized/i);
  });

  test('rejects candidate attempting to DELETE /api/jobs/:id with 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/jobs/job-001')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(res.status, 403);
    assert.match(res.body.error, /is not authorized/i);
  });

  test('rejects candidate attempting to DELETE /api/interviews/:id with 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/interviews/int-001')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(res.status, 403);
    assert.match(res.body.error, /is not authorized/i);
  });

  test('rejects candidate attempting to GET /api/reports/metrics with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(res.status, 403);
    assert.match(res.body.error, /is not authorized/i);
  });

  // 4. Authorized Access Verification (200 / 201)
  test('allows company role to access GET /api/interviews with valid token', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('allows company role to access GET /api/shortlists with valid token', async () => {
    const res = await request(app)
      .get('/api/shortlists')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('allows company role to access GET /api/reports/metrics with valid token', async () => {
    const res = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totalCandidates >= 0);
  });

  // 5. Anti-Impersonation Protection (Client-supplied IDs ignored)
  test('derives sender identity securely from token on POST /api/messages (ignores body senderId)', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        senderId: 'hacked-victim-user-999',
        conversationId: 'security-conversation',
        recipientId: 'cand-001',
        content: 'Secure authenticated test message'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.senderId, 'usr-company-sec-01');
    assert.equal(res.body.data.senderName, 'Security Lead');
  });

  test('derives shortlist owner securely from token on POST /api/shortlists/toggle (ignores body userId)', async () => {
    const res = await request(app)
      .post('/api/shortlists/toggle')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        userId: 'victim_impersonated_id_888',
        candidateId: 'cand-002',
        jobId: 'job-001'
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    if (res.body.item) {
      assert.equal(res.body.item.userId, 'usr-company-sec-01');
    }
  });

  // 6. Public Endpoint Preservation
  test('verifies public read endpoints remain accessible without auth', async () => {
    const healthRes = await request(app).get('/api/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.status, 'ok');

    const candidatesRes = await request(app).get('/api/candidates');
    assert.equal(candidatesRes.status, 200);
    assert.equal(candidatesRes.body.success, true);

    const jobsRes = await request(app).get('/api/jobs');
    assert.equal(jobsRes.status, 200);
    assert.equal(jobsRes.body.success, true);
  });

  // 7. Authentication Flow Credentials Validation
  test('login with valid demo credentials succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'richardfeynman@gmail.com', password: 'password123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'richardfeynman@gmail.com');
  });

  test('login with invalid credentials fails with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'richardfeynman@gmail.com', password: 'wrong_password_999' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Invalid email or password/i);
  });
});
