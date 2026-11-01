import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';

describe('Hirevoxa Auth Endpoints', () => {
  test('POST /api/auth/demo-login returns demo token and Richard Feynman user', async () => {
    const res = await request(app).post('/api/auth/demo-login').send({ role: 'company' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, 'Richard Feynman');
    assert.equal(res.body.user.role, 'company');
  });

  test('POST /api/auth/demo-login for candidate returns candidate profile', async () => {
    const res = await request(app).post('/api/auth/demo-login').send({ role: 'candidate' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'candidate');
  });

  test('POST /api/auth/login validates credentials correctly for demo accounts', async () => {
    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'richardfeynman@gmail.com',
      password: 'wrongpassword'
    });
    assert.equal(badLogin.status, 401);

    const goodLogin = await request(app).post('/api/auth/login').send({
      email: 'richardfeynman@gmail.com',
      password: 'password123'
    });
    assert.equal(goodLogin.status, 200);
    assert.ok(goodLogin.body.token);
    assert.equal(goodLogin.body.user.email, 'richardfeynman@gmail.com');
  });

  test('POST /api/auth/register creates a new user and generates token', async () => {
    const email = `newuser_${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sofia Valenzuela',
      email,
      password: 'mypassword123',
      role: 'company',
      companyName: 'Fintech Latam Ventures'
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, 'Sofia Valenzuela');
  });

  // Comprehensive Registration-to-Login Verification Tests
  test('Candidate registration followed immediately by candidate login with same credentials', async () => {
    const candidateEmail = `candidate_reg_${Date.now()}@example.com`;
    const candidatePassword = 'SecurePassword#2026!';

    // 1. Register candidate
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Camila Rodriguez',
      email: candidateEmail,
      password: candidatePassword,
      role: 'candidate'
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);
    assert.equal(regRes.body.user.role, 'candidate');
    assert.equal(regRes.body.user.email, candidateEmail.toLowerCase());

    // 2. Immediately login with exact same credentials
    const loginRes = await request(app).post('/api/auth/login').send({
      email: candidateEmail,
      password: candidatePassword
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.ok(loginRes.body.token);
    assert.equal(loginRes.body.user.email, candidateEmail.toLowerCase());
    assert.equal(loginRes.body.user.role, 'candidate');
  });

  test('Employer registration followed immediately by employer login with same credentials', async () => {
    const companyEmail = `employer_reg_${Date.now()}@example.com`;
    const companyPassword = 'EmployerPass#2026!';

    // 1. Register employer
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Alejandro Gomez',
      email: companyEmail,
      password: companyPassword,
      role: 'company',
      companyName: 'Andes Cloud Systems'
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);
    assert.equal(regRes.body.user.role, 'company');
    assert.equal(regRes.body.user.companyName, 'Andes Cloud Systems');

    // 2. Immediately login with exact same credentials
    const loginRes = await request(app).post('/api/auth/login').send({
      email: companyEmail,
      password: companyPassword
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.ok(loginRes.body.token);
    assert.equal(loginRes.body.user.email, companyEmail.toLowerCase());
    assert.equal(loginRes.body.user.role, 'company');
  });

  test('Email case-insensitivity: registered lowercase, logged in with uppercase', async () => {
    const baseEmail = `case_test_${Date.now()}@example.com`;
    const password = 'CaseTestPassword#123';

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Mariana Silva',
      email: baseEmail.toLowerCase(),
      password,
      role: 'company',
      companyName: 'Case Sensitivity Inc'
    });
    assert.equal(regRes.status, 201);

    // Login with uppercase variant
    const loginRes = await request(app).post('/api/auth/login').send({
      email: baseEmail.toUpperCase(),
      password
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.user.email, baseEmail.toLowerCase());
  });

  test('Email whitespace normalization: registered with padding, logged in with whitespace', async () => {
    const baseEmail = `whitespace_${Date.now()}@example.com`;
    const password = 'WhitespacePassword#123';

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Diego Lopez',
      email: `  ${baseEmail}  `,
      password,
      role: 'candidate'
    });
    assert.equal(regRes.status, 201);

    // Login with leading/trailing whitespace
    const loginRes = await request(app).post('/api/auth/login').send({
      email: `   ${baseEmail}   `,
      password
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
  });

  test('Login rejects unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent_user_99999@example.com',
      password: 'SomePassword123!'
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password.');
  });

  test('Login rejects incorrect password with 401', async () => {
    const email = `passcheck_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'Test Pass',
      email,
      password: 'CorrectPassword123!',
      role: 'candidate'
    });

    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword999!'
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password.');
  });

  test('POST /api/auth/logout clears session cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
