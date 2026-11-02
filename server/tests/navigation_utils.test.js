import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPath, getDashboardLabel } from '../../client/src/utils/navigation.js';

describe('Hirevoxa Role-Based Navigation & Destination Suite', () => {
  test('1. Unauthenticated or empty user routes to /login', () => {
    assert.equal(getDashboardPath(null), '/login');
    assert.equal(getDashboardPath(undefined), '/login');
    assert.equal(getDashboardPath({}), '/app');
  });

  test('2. Candidate user routes to /candidate', () => {
    assert.equal(getDashboardPath({ role: 'candidate' }), '/candidate');
    assert.equal(getDashboardPath({ role: 'Candidate' }), '/candidate');
    assert.equal(getDashboardPath({ role: '  candidate  ' }), '/candidate');
    assert.equal(getDashboardLabel({ role: 'candidate' }), 'Candidate Dashboard');
  });

  test('3. Employer / Company user routes to /app', () => {
    assert.equal(getDashboardPath({ role: 'company' }), '/app');
    assert.equal(getDashboardPath({ role: 'employer' }), '/app');
    assert.equal(getDashboardPath({ role: 'Company' }), '/app');
    assert.equal(getDashboardLabel({ role: 'company' }), 'Dashboard');
  });

  test('4. Admin user routes to /admin', () => {
    assert.equal(getDashboardPath({ role: 'admin' }), '/admin');
    assert.equal(getDashboardPath({ role: 'Admin' }), '/admin');
    assert.equal(getDashboardLabel({ role: 'admin' }), 'Admin Panel');
  });

  test('5. Safe fallback for unknown or malformed role', () => {
    assert.equal(getDashboardPath({ role: 'unknown_role' }), '/app');
    assert.equal(getDashboardPath({ role: 12345 }), '/app');
    assert.equal(getDashboardLabel(null), 'Dashboard');
  });
});

