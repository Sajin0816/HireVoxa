import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { inMemoryStore } from '../src/services/inMemoryStore.js';

describe('Phase D — End-to-End Synthetic Account Verification Suite', () => {
  const timestamp = Date.now();
  const candEmail = `qa+candidate-${timestamp}@example.com`;
  const candPass = 'SecurePass_2026!Cand';
  const empEmail = `qa+employer-${timestamp}@example.com`;
  const empPass = 'SecurePass_2026!Emp';

  let candToken = '';
  let empToken = '';
  let createdJobId = '';

  before(async () => {
    await connectDB();
    inMemoryStore.reset();
  });

  test('1. Candidate Registration succeeds and returns JWT token and candidate role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'QA Synthetic Candidate',
        email: candEmail,
        password: candPass,
        role: 'candidate'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'candidate');
    assert.equal(res.body.user.email, candEmail.toLowerCase());
    assert.ok(res.body.token);
    candToken = res.body.token;
  });

  test('2. Candidate Logout terminates session cleanly', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${candToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('3. Candidate Login with identical credentials succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: candEmail,
        password: candPass
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'candidate');
    assert.ok(res.body.token);
    candToken = res.body.token;
  });

  test('4. Candidate Session persists across refresh (/api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, candEmail.toLowerCase());
    assert.equal(res.body.user.role, 'candidate');
  });

  test('5. Candidate can access Candidate portal endpoints', async () => {
    const profileRes = await request(app)
      .get('/api/candidates/me')
      .set('Authorization', `Bearer ${candToken}`);
    assert.equal(profileRes.status, 200);

    const appsRes = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${candToken}`);
    assert.equal(appsRes.status, 200);
    assert.ok(Array.isArray(appsRes.body.data));

    const intsRes = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${candToken}`);
    assert.equal(intsRes.status, 200);
    assert.ok(Array.isArray(intsRes.body.data));
  });

  test('6. Employer Registration succeeds and returns JWT token and company role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'QA Synthetic Employer',
        email: empEmail,
        password: empPass,
        role: 'company',
        companyName: 'Acme Test Corp'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'company');
    assert.equal(res.body.user.email, empEmail.toLowerCase());
    assert.ok(res.body.token);
    empToken = res.body.token;
  });

  test('7. Employer Logout terminates session cleanly', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('8. Employer Login with identical credentials succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: empEmail,
        password: empPass
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'company');
    assert.ok(res.body.token);
    empToken = res.body.token;
  });

  test('9. Employer Session persists across refresh (/api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, empEmail.toLowerCase());
    assert.equal(res.body.user.role, 'company');
  });

  test('10. Employer creates job and queries dashboard resources', async () => {
    const createJobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        title: 'Senior Distributed Systems Engineer',
        description: 'Lead engineering team on distributed consensus and high availability infrastructure.',
        department: 'Infrastructure',
        requiredSkills: ['Go', 'Kubernetes', 'PostgreSQL'],
        minimumExperience: 5,
        budgetRange: '$5,000 - $6,500/mo',
        timeZoneOverlapRequirements: 'EST +/- 2 hours'
      });

    assert.equal(createJobRes.status, 201);
    assert.ok(createJobRes.body.data._id);
    createdJobId = createJobRes.body.data._id;

    const jobsRes = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(jobsRes.status, 200);
    assert.ok(jobsRes.body.data.some((j) => j._id === createdJobId));

    const appsRes = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(appsRes.status, 200);
    assert.ok(Array.isArray(appsRes.body.data));

    const intsRes = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(intsRes.status, 200);
    assert.ok(Array.isArray(intsRes.body.data));
  });

  test('11. Security & Role Isolation: Candidate cannot create jobs or access admin', async () => {
    const postJobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candToken}`)
      .send({ title: 'Unauthorized Job', department: 'Engineering' });
    assert.equal(postJobRes.status, 403);

    const adminRes = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${candToken}`);
    assert.equal(adminRes.status, 403);
  });

  test('12. Security & Role Isolation: Employer cannot access admin metrics', async () => {
    const empAdminRes = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${empToken}`);
    assert.equal(empAdminRes.status, 403);
  });

  test('13. Admin access verified with authorized platform credentials', async () => {
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@hirevoxa.internal', password: 'password123' });

    assert.equal(adminLoginRes.status, 200);
    assert.equal(adminLoginRes.body.user.role, 'admin');
    assert.equal(adminLoginRes.body.user.adminRole, 'owner');

    const adminSummaryRes = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${adminLoginRes.body.token}`);
    assert.equal(adminSummaryRes.status, 200);
    assert.equal(adminSummaryRes.body.success, true);
  });
});
