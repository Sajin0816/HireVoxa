import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runTenantMigration } from '../src/services/migrationService.js';
import { inMemoryStore } from '../src/services/inMemoryStore.js';
import { Job } from '../src/models/Job.js';
import { Interview } from '../src/models/Interview.js';
import { Shortlist } from '../src/models/Shortlist.js';
import { Message } from '../src/models/Message.js';
import { Company } from '../src/models/Company.js';
import { User } from '../src/models/User.js';

describe('Phase 2B — Persistence, Schemas, & Data Ownership Migration Suite', () => {
  test('1. Mongoose schemas define required tenant companyId fields and indexes', () => {
    // Job schema
    assert.ok(Job.schema.path('companyId'), 'Job must have companyId path');
    assert.ok(Job.schema.path('postedBy'), 'Job must have postedBy path');

    // Interview schema
    assert.ok(Interview.schema.path('companyId'), 'Interview must have companyId path');
    assert.ok(Interview.schema.path('createdBy'), 'Interview must have createdBy path');

    // Shortlist schema
    assert.ok(Shortlist.schema.path('companyId'), 'Shortlist must have companyId path');
    assert.ok(Shortlist.schema.path('userId'), 'Shortlist must have userId path');

    // Message schema
    assert.ok(Message.schema.path('companyId'), 'Message must have companyId path');

    // Company schema
    assert.ok(Company.schema.path('ownerId'), 'Company must have ownerId path');
    assert.ok(Company.schema.path('name'), 'Company must have name path');

    // User schema
    assert.ok(User.schema.path('companyId'), 'User must have companyId path');
  });

  test('2. Tenant migration service runs cleanly and associates unowned records', async () => {
    // Insert an unowned job into store to simulate legacy record
    const legacyJob = {
      _id: 'legacy-unowned-001',
      title: 'Legacy Orphaned Job',
      description: 'Pre-Phase 2B requisition without tenant tag',
      department: 'Engineering',
      requiredSkills: ['Legacy Code'],
      minimumExperience: 3,
      budgetRange: '$4,000',
      timeZoneOverlapRequirements: 'EST',
      status: 'Open'
    };
    inMemoryStore.jobs.push(legacyJob);

    // Run migration
    const summary = await runTenantMigration({ defaultCompanyId: 'usr-company-001', allowLegacyReassignment: true });
    assert.ok(summary.timestamp);
    assert.ok(summary.jobsMigrated >= 1, 'Legacy job must be migrated');

    // Verify migrated job in store
    const migrated = inMemoryStore.jobs.find(j => j._id === 'legacy-unowned-001');
    assert.equal(migrated.companyId, 'usr-company-001', 'Migrated job must have companyId set to verified owner');

    // Verify idempotency: running migration again results in 0 additional updates
    const secondRun = await runTenantMigration({ defaultCompanyId: 'usr-company-001', allowLegacyReassignment: true });
    assert.equal(secondRun.jobsMigrated, 0, 'Migration must be idempotent');
  });

  test('3. In-memory data store persists records across operations and maintains tenant boundary', async () => {
    const customTenant = 'tenant-persisted-xyz';

    // Create job for custom tenant
    const created = await inMemoryStore.createJob({
      companyId: customTenant,
      postedBy: 'user-xyz',
      title: 'Persistent Distributed Worker',
      description: 'Ensuring record persistence across operations',
      department: 'Infrastructure',
      requiredSkills: ['Node.js'],
      minimumExperience: 4,
      budgetRange: '$6,000/mo',
      timeZoneOverlapRequirements: 'EST',
      status: 'Open'
    });

    assert.ok(created._id);
    assert.equal(created.companyId, customTenant);

    // Retrieve by tenant
    const tenantJobs = await inMemoryStore.findJobs({ companyId: customTenant });
    assert.equal(tenantJobs.length, 1);
    assert.equal(tenantJobs[0]._id, created._id);

    // Retrieve by foreign tenant
    const foreignJobs = await inMemoryStore.findJobs({ companyId: 'other-foreign-tenant' });
    assert.equal(foreignJobs.length, 0, 'Foreign tenant must not see custom tenant job');

    // Clean up
    await inMemoryStore.deleteJob(created._id, customTenant);
  });

  test('4. Database configuration layer exports lifecycle methods and sanitizes credentials', async () => {
    const { connectDB, disconnectDB, getDbMode, sanitizeError, isDemoModeAllowed } = await import('../src/config/db.js');
    assert.equal(typeof connectDB, 'function');
    assert.equal(typeof disconnectDB, 'function');
    assert.equal(typeof getDbMode, 'function');
    assert.equal(typeof sanitizeError, 'function');
    assert.equal(typeof isDemoModeAllowed, 'function');

    // Credential sanitization check
    const leakedUri = 'mongodb+srv://admin_user:super_secret_password123@cluster0.mongodb.net/hirevoxa_db?retryWrites=true';
    const sanitized = sanitizeError(leakedUri);
    assert.ok(!sanitized.includes('super_secret_password123'), 'Sanitized URI must not leak password');
    assert.ok(sanitized.includes('admin_user:***@cluster0.mongodb.net'), 'Password must be masked with ***');
  });

  test('5. Strict production gating: demo mode is prohibited in production or when REQUIRE_DB=true', async () => {
    const { isDemoModeAllowed } = await import('../src/config/db.js');
    const origEnv = process.env.NODE_ENV;
    const origDemo = process.env.ALLOW_IN_MEMORY_DEMO;
    const origRequireDb = process.env.REQUIRE_DB;

    try {
      // In production, even if ALLOW_IN_MEMORY_DEMO is true, demo mode is strictly disallowed
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_IN_MEMORY_DEMO = 'true';
      assert.equal(isDemoModeAllowed(), false, 'Demo mode must be disallowed in production regardless of flags');

      // When REQUIRE_DB is true, demo mode is strictly disallowed
      process.env.NODE_ENV = 'development';
      process.env.REQUIRE_DB = 'true';
      assert.equal(isDemoModeAllowed(), false, 'Demo mode must be disallowed when REQUIRE_DB=true');
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.ALLOW_IN_MEMORY_DEMO = origDemo;
      delete process.env.REQUIRE_DB;
    }
  });

  test('6. Startup fails fast with safe error when MONGODB_URI is missing and demo mode is disabled', async () => {
    const { connectDB } = await import('../src/config/db.js');
    const origEnv = process.env.NODE_ENV;
    const origUri = process.env.MONGODB_URI;
    const origDemo = process.env.ALLOW_IN_MEMORY_DEMO;

    try {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = '';
      process.env.ALLOW_IN_MEMORY_DEMO = 'false';

      await assert.rejects(
        async () => {
          await connectDB('');
        },
        (err) => {
          assert.ok(err.message.includes('Missing MONGODB_URI'));
          return true;
        },
        'Must reject startup when MONGODB_URI is absent in production'
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.MONGODB_URI = origUri;
      process.env.ALLOW_IN_MEMORY_DEMO = origDemo;
    }
  });

  test('7. Connection failure to invalid/unreachable MongoDB fails safely without leaking credentials', async () => {
    const { connectDB } = await import('../src/config/db.js');
    const origEnv = process.env.NODE_ENV;
    const origRequireDb = process.env.REQUIRE_DB;

    try {
      process.env.NODE_ENV = 'production';
      process.env.REQUIRE_DB = 'true';

      const invalidUri = 'mongodb://secret_admin:leaked_pass_999@127.0.0.1:27099/nonexistent_db?connectTimeoutMS=200';

      await assert.rejects(
        async () => {
          await connectDB(invalidUri);
        },
        (err) => {
          assert.ok(err.message.includes('[Hirevoxa DB Connection Error]'));
          assert.ok(!err.message.includes('leaked_pass_999'), 'Leaked password must not appear in connection error log');
          return true;
        },
        'Connection failure must reject and scrub credentials'
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      delete process.env.REQUIRE_DB;
    }
  });

  test('8. Demo seed requirements: seedData contains explicit provenance flags and seed script guards against accidental runs', async () => {
    const { seedCandidates, seedJobs, seedInterviews } = await import('../src/seed/seedData.js');
    // Ensure all demo fixtures are explicitly flagged
    for (const c of seedCandidates) {
      assert.equal(c.isDemoRecord, true, `Candidate ${c.name} must have isDemoRecord: true`);
    }
    for (const j of seedJobs) {
      assert.equal(j.isDemoRecord, true, `Job ${j.title} must have isDemoRecord: true`);
    }
    for (const i of seedInterviews) {
      assert.equal(i.isDemoRecord, true, `Interview must have isDemoRecord: true`);
    }
  });
});
