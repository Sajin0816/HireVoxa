import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isJwtConfigured, getJwtSecret, getJwtDiagnostics } from '../src/config/jwt.js';

describe('Hirevoxa Authoritative JWT Configuration Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('1. isJwtConfigured returns false when JWT_SECRET is unset or empty', () => {
    delete process.env.JWT_SECRET;
    assert.equal(isJwtConfigured(), false);

    process.env.JWT_SECRET = '';
    assert.equal(isJwtConfigured(), false);

    process.env.JWT_SECRET = '   ';
    assert.equal(isJwtConfigured(), false);
  });

  test('2. isJwtConfigured returns false when JWT_SECRET is the dev placeholder', () => {
    process.env.JWT_SECRET = 'hirevoxa_jwt_secret_dev_2026';
    assert.equal(isJwtConfigured(), false);
  });

  test('3. isJwtConfigured returns true when a valid non-default secret is configured', () => {
    process.env.JWT_SECRET = 'eb09ea4de488f8587a15b061b2ad3e0b38346a4f9429b9af2c745ba8170450e5c4a86090233e4445f01c5e2e144d249583bb08f2ebd696012f4edc7490a087c6';
    assert.equal(isJwtConfigured(), true);
  });

  test('4. getJwtSecret returns configured secret in any environment', () => {
    const testSecret = 'my_super_strong_custom_production_secret_key_12345';
    process.env.JWT_SECRET = testSecret;
    process.env.NODE_ENV = 'production';
    assert.equal(getJwtSecret(), testSecret);

    process.env.NODE_ENV = 'development';
    assert.equal(getJwtSecret(), testSecret);
  });

  test('5. getJwtSecret returns dev fallback in development and test environments when unset', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';
    assert.equal(getJwtSecret(), 'hirevoxa_jwt_secret_dev_2026');

    process.env.NODE_ENV = 'test';
    assert.equal(getJwtSecret(), 'hirevoxa_jwt_secret_dev_2026');
  });

  test('6. getJwtSecret throws safe, descriptive error in production when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    assert.throws(
      () => getJwtSecret(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Security Error\] Missing JWT_SECRET/);
        assert.match(err.message, /Production environments require an explicitly configured JWT_SECRET/);
        return true;
      }
    );
  });

  test('7. getJwtSecret throws in production if JWT_SECRET is merely the dev default', () => {
    process.env.JWT_SECRET = 'hirevoxa_jwt_secret_dev_2026';
    process.env.NODE_ENV = 'production';

    assert.throws(
      () => getJwtSecret(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Security Error\] Missing JWT_SECRET/);
        return true;
      }
    );
  });

  test('8. getJwtDiagnostics returns safe metadata without leaking the secret', () => {
    const testSecret = '0123456789abcdef0123456789abcdef';
    process.env.JWT_SECRET = testSecret;

    const diag = getJwtDiagnostics();
    assert.equal(diag.jwtConfigured, true);
    assert.equal(diag.jwtLength, 32);
    assert.equal(diag.secret, undefined);
    assert.equal(diag.value, undefined);

    const serialized = JSON.stringify(diag);
    assert.equal(serialized.includes(testSecret), false);
  });
});

