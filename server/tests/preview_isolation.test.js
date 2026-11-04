import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPreviewDeployment,
  resolveDbName,
  isDemoModeAllowed,
  connectDB,
  disconnectDB,
  getDbMode,
  getDbState
} from '../src/config/db.js';

describe('Hirevoxa Backend Preview Isolation & Fail-Closed Database Protection', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };
    await disconnectDB();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await disconnectDB();
  });

  test('1. isPreviewDeployment correctly identifies Preview via VERCEL_ENV or APP_ENV', () => {
    process.env.VERCEL_ENV = 'preview';
    assert.equal(isPreviewDeployment(), true);

    delete process.env.VERCEL_ENV;
    process.env.APP_ENV = 'preview';
    assert.equal(isPreviewDeployment(), true);

    process.env.VERCEL_ENV = 'production';
    delete process.env.APP_ENV;
    assert.equal(isPreviewDeployment(), false);

    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'development';
    assert.equal(isPreviewDeployment(), false);
  });

  test('2. Preview with MONGODB_DB_NAME=hirevoxa_qa successfully resolves QA database name', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGODB_DB_NAME = 'hirevoxa_qa';

    const resolved = resolveDbName();
    assert.equal(resolved, 'hirevoxa_qa');
  });

  test('3. Preview without MONGODB_DB_NAME fails safely and does not default to production', () => {
    process.env.VERCEL_ENV = 'preview';
    delete process.env.MONGODB_DB_NAME;

    assert.throws(
      () => resolveDbName(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa DB Isolation Error\] Missing MONGODB_DB_NAME in Preview environment/);
        assert.match(err.message, /Silently falling back to the production database is strictly prohibited/);
        return true;
      }
    );
  });

  test('4. Preview with empty or whitespace MONGODB_DB_NAME fails safely', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGODB_DB_NAME = '   ';

    assert.throws(
      () => resolveDbName(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa DB Isolation Error\] Missing MONGODB_DB_NAME in Preview environment/);
        return true;
      }
    );
  });

  test('5. Preview with MONGODB_DB_NAME=hirevoxa (Production DB) strictly rejected with isolation error', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGODB_DB_NAME = 'hirevoxa';

    assert.throws(
      () => resolveDbName(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa DB Isolation Error\] Resolved database in Preview environment is 'hirevoxa'/);
        assert.match(err.message, /Connecting a Preview deployment to the production database is strictly prohibited/);
        return true;
      }
    );
  });

  test('6. Preview with any unauthorized database name (e.g. hirevoxa_prod_clone) is rejected', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGODB_DB_NAME = 'hirevoxa_prod_clone';

    assert.throws(
      () => resolveDbName(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa DB Isolation Error\] Invalid MONGODB_DB_NAME 'hirevoxa_prod_clone'/);
        assert.match(err.message, /strictly restricted to 'hirevoxa_qa'/);
        return true;
      }
    );
  });

  test('7. Preview with missing MONGODB_URI fails safely in connectDB', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.MONGODB_DB_NAME = 'hirevoxa_qa';
    delete process.env.MONGODB_URI;

    await assert.rejects(
      async () => connectDB(),
      (err) => {
        assert.match(err.message, /\[Hirevoxa DB Config Error\] Missing MONGODB_URI/);
        assert.match(err.message, /Preview environments require an explicitly configured MONGODB_URI/);
        return true;
      }
    );
    assert.equal(getDbMode(), 'unavailable');
  });

  test('8. isDemoModeAllowed strictly returns false in Preview even if ALLOW_IN_MEMORY_DEMO=true', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.ALLOW_IN_MEMORY_DEMO = 'true';
    process.env.NODE_ENV = 'development';

    assert.equal(isDemoModeAllowed(), false);
  });

  test('9. Production continues using its existing intended database configuration', () => {
    process.env.VERCEL_ENV = 'production';
    delete process.env.MONGODB_DB_NAME;

    // In production without explicit override, defaults to canonical production db 'hirevoxa'
    const resolvedDefault = resolveDbName();
    assert.equal(resolvedDefault, 'hirevoxa');

    // In production with explicit override
    process.env.MONGODB_DB_NAME = 'hirevoxa_custom';
    const resolvedCustom = resolveDbName();
    assert.equal(resolvedCustom, 'hirevoxa_custom');
  });

  test('10. Local development continues to work seamlessly', () => {
    delete process.env.VERCEL_ENV;
    delete process.env.APP_ENV;
    process.env.NODE_ENV = 'development';

    // Local without explicit override
    delete process.env.MONGODB_DB_NAME;
    assert.equal(resolveDbName(), 'hirevoxa');

    // Local with explicit hirevoxa_qa override
    process.env.MONGODB_DB_NAME = 'hirevoxa_qa';
    assert.equal(resolveDbName(), 'hirevoxa_qa');
  });
});
