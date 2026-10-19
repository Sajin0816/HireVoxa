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

  test('POST /api/auth/login validates credentials correctly', async () => {
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
});
