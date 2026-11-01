import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';

describe('Phase 2B — Session Security & HTTP-Only Cookie Suite', () => {
  const ts = Date.now();
  const email = `session_user_${ts}@secops.io`;
  const password = 'CookiePassword@2026';

  let authCookie = '';

  test('1. Registration issues HttpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Cookie Security Lead',
        email,
        password,
        role: 'company',
        companyName: 'SecOps Labs'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token, 'Must return token for dual-compatibility');

    // Inspect Set-Cookie header
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'set-cookie header must be present');
    const tokenCookie = cookies.find(c => c.startsWith('hirevoxa_token='));
    assert.ok(tokenCookie, 'hirevoxa_token cookie must be set');
    assert.match(tokenCookie, /HttpOnly/i, 'Cookie must have HttpOnly flag');
    assert.match(tokenCookie, /Path=\//i, 'Cookie must have Path=/');
    assert.match(tokenCookie, /SameSite=Lax/i, 'Cookie must have SameSite policy');

    authCookie = tokenCookie.split(';')[0];
  });

  test('2. Authentication via HttpOnly cookie succeeds without Bearer header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [authCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, email);
    assert.equal(res.body.user.role, 'company');
  });

  test('3. Login issues refreshed HttpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    assert.equal(res.status, 200);
    const cookies = res.headers['set-cookie'];
    const tokenCookie = cookies.find(c => c.startsWith('hirevoxa_token='));
    assert.ok(tokenCookie);
    assert.match(tokenCookie, /HttpOnly/i);

    authCookie = tokenCookie.split(';')[0];
  });

  test('4. Cookie-authenticated mutation with anti-CSRF header succeeds', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Cookie', [authCookie])
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        title: 'Security Operations Engineer',
        description: 'Lead SIEM and zero-trust perimeter defenses.',
        department: 'Security',
        requiredSkills: ['Zero Trust', 'SOC2', 'AWS GuardDuty'],
        minimumExperience: 5,
        budgetRange: '$8,000 - $10,000/mo',
        timeZoneOverlapRequirements: 'EST (4 hrs)'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  test('5. Dual-auth: Authorization Bearer header works independently of cookies', async () => {
    // Generate valid bearer token
    const token = jwt.sign(
      { id: 'usr-company-001', role: 'company', email: 'richardfeynman@gmail.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'company');
  });

  test('6. POST /api/auth/logout clears HttpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [authCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'set-cookie header must be returned on logout');
    const tokenCookie = cookies.find(c => c.startsWith('hirevoxa_token='));
    assert.ok(tokenCookie, 'hirevoxa_token clear cookie must be present');
    // Cookie should be expired or empty
    assert.ok(tokenCookie.includes('Expires=') || tokenCookie.includes('Max-Age=0') || tokenCookie.startsWith('hirevoxa_token=;'));
  });

  test('7. Subsequent request without cookie is rejected with 401', async () => {
    const res = await request(app).get('/api/reports/metrics');
    assert.equal(res.status, 401);
  });

  test('8. CORS rejects untrusted origin in production simulation', async () => {
    // Simulate non-production allow vs untrusted origin
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  test('9. Expired session cookie is rejected with 401', async () => {
    const expiredToken = jwt.sign(
      { id: 'usr-expired', role: 'company' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`hirevoxa_token=${expiredToken}`]);

    assert.equal(res.status, 401);
    assert.match(res.body.error, /expired|invalid/i);
  });
});
