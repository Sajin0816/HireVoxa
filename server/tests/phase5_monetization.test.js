import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';
import { inMemoryStore } from '../src/services/inMemoryStore.js';
import { PRICING_CONFIG } from '../src/config/pricing.js';

describe('Phase 5 — Monetization System Tests', () => {
  let companyCookie;
  let adminCookie;
  let candidateCookie;

  before(async () => {
    inMemoryStore.reset();

    // Login as company
    const compRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'richardfeynman@gmail.com', password: 'password123' });
    assert.equal(compRes.status, 200);
    companyCookie = compRes.headers['set-cookie'];

    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@hirevoxa.internal', password: 'password123' });
    assert.equal(adminRes.status, 200);
    adminCookie = adminRes.headers['set-cookie'];

    // Login as candidate
    const candRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rodrigo@hirevoxa-latam.dev', password: 'password123' });
    assert.equal(candRes.status, 200);
    candidateCookie = candRes.headers['set-cookie'];
  });

  describe('1. Authoritative Pricing Configuration Endpoint', () => {
    test('GET /api/pricing returns authoritative server pricing data without secret keys', async () => {
      const res = await request(app).get('/api/pricing');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.CANDIDATE.priceCents, 0);
      assert.equal(res.body.data.EMPLOYER_STARTER.priceCents, 0);
      assert.equal(res.body.data.EMPLOYER_PRO.priceCents, 19900); // $199
      assert.equal(res.body.data.SUCCESSFUL_PLACEMENT.feeCents, 250000); // $2,500
      assert.equal(res.body.data.SUCCESSFUL_PLACEMENT.guaranteePeriodDays, 90);
    });

    test('GET /api/billing/pricing redirects or serves matching pricing config', async () => {
      const res = await request(app).get('/api/billing/pricing');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.EMPLOYER_PRO.priceFormatted, '$199');
      assert.equal(res.body.data.SUCCESSFUL_PLACEMENT.feeFormatted, '$2,500');
    });
  });

  describe('2. Recruiter Starter Entitlements & Pilot Limits', () => {
    test('GET /api/billing/company returns starter plan and pilot limits for newly enrolled company', async () => {
      const res = await request(app)
        .get('/api/billing/company')
        .set('Cookie', companyCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.company.plan, 'starter');
      assert.equal(res.body.data.usage.maxActiveJobs, 5);
      assert.equal(res.body.data.usage.searchTier, 'standard');
    });

    test('Enforces pilot limit: cannot create more than 5 active jobs on Starter tier', async () => {
      // Ensure company starts with 5 open jobs
      inMemoryStore.jobs = inMemoryStore.jobs.filter(j => j.companyId !== 'usr-company-001');

      for (let i = 1; i <= 5; i++) {
        const createRes = await request(app)
          .post('/api/jobs')
          .set('Cookie', companyCookie)
          .send({
            title: `Engineering Pilot Job ${i}`,
            description: 'Full stack development role in Latin America',
            budgetRange: '$80k - $110k',
            timeZoneOverlapRequirements: '4 hours EST overlap',
            requiredSkills: ['Node.js', 'React']
          });
        assert.equal(createRes.status, 201, `Job ${i} creation failed`);
      }

      // 6th active job should be rejected by server-side entitlement check with 403
      const limitRes = await request(app)
        .post('/api/jobs')
        .set('Cookie', companyCookie)
        .send({
          title: '6th Job Over Limit',
          description: 'This job should be blocked by pilot limits',
          budgetRange: '$90k - $120k',
          timeZoneOverlapRequirements: 'EST overlap',
          requiredSkills: ['TypeScript']
        });

      assert.equal(limitRes.status, 403);
      assert.equal(limitRes.body.code, 'PILOT_LIMIT_REACHED');
      assert.equal(limitRes.body.limit, 5);
    });
  });

  describe('3. Successful Placement Fee Lifecycle ($2,500 & Idempotency)', () => {
    let testApplicationId;

    before(async () => {
      // Create a test application in Offered state
      const job = inMemoryStore.jobs[0];
      const appRecord = await inMemoryStore.createApplication({
        candidateUserId: 'usr-candidate-001',
        candidateId: 'cand-001',
        jobId: job._id,
        companyId: 'usr-company-001',
        status: 'Offered',
        coverNote: 'Excited about the platform architecture.'
      });
      testApplicationId = appRecord._id;
    });

    test('Transitioning application to "Hired" automatically registers eligible placement fee ($2,500)', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApplicationId}/status`)
        .set('Cookie', companyCookie)
        .send({
          status: 'Hired',
          reason: 'Offer accepted by candidate'
        });

      assert.equal(res.status, 200);

      // Verify placement fee was logged
      const fee = await inMemoryStore.findPlacementFeeByApplicationId(testApplicationId);
      assert.ok(fee, 'Placement fee record should exist');
      assert.equal(fee.feeAmountCents, 250000); // $2,500
      assert.equal(fee.currency, 'USD');
      assert.equal(fee.status, 'eligible');
      assert.ok(fee.placementId.startsWith('PLF-'));
      assert.ok(new Date(fee.replacementGuaranteeExpiry) > new Date());
    });

    test('Idempotency: Re-triggering placement service does not duplicate placement fee for same application', async () => {
      const feesBefore = await inMemoryStore.findPlacementFees({ applicationId: testApplicationId });
      assert.equal(feesBefore.length, 1);

      // Import service and re-trigger directly
      const { triggerHiringPlacementFee } = await import('../src/services/placementBillingService.js');
      const secondCallResult = await triggerHiringPlacementFee({
        application: {
          _id: testApplicationId,
          candidateUserId: 'usr-candidate-001',
          candidateId: 'cand-001',
          jobId: 'job-001',
          companyId: 'usr-company-001'
        },
        actorUserId: 'usr-company-001'
      });

      assert.equal(secondCallResult.placementId, feesBefore[0].placementId);

      const feesAfter = await inMemoryStore.findPlacementFees({ applicationId: testApplicationId });
      assert.equal(feesAfter.length, 1, 'Should still only have exactly 1 placement fee');
    });

    test('Recruiter can pay their eligible placement fee', async () => {
      const fee = await inMemoryStore.findPlacementFeeByApplicationId(testApplicationId);
      assert.ok(fee);

      const payRes = await request(app)
        .post(`/api/billing/placements/${fee._id}/pay`)
        .set('Cookie', companyCookie);

      assert.equal(payRes.status, 200);
      assert.equal(payRes.body.success, true);

      const updatedFee = await inMemoryStore.findPlacementFeeById(fee._id);
      assert.equal(updatedFee.status, 'paid');
      assert.ok(updatedFee.paidAt);
      assert.ok(updatedFee.paymentReference);
    });

    test('Another company cannot pay or access this placement fee (Tenant Isolation)', async () => {
      // Create a temporary second company
      const otherCompanyCookie = (await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other Corp',
          email: 'other@corp.internal',
          password: 'password123',
          role: 'company',
          companyName: 'Other Corp'
        })).headers['set-cookie'];

      const fee = await inMemoryStore.findPlacementFeeByApplicationId(testApplicationId);

      const unauthorizedRes = await request(app)
        .post(`/api/billing/placements/${fee._id}/pay`)
        .set('Cookie', otherCompanyCookie);

      assert.equal(unauthorizedRes.status, 403);
    });
  });

  describe('4. Employer Pro Subscription ($199/month Upgrade & Cancellation)', () => {
    test('Recruiter upgrades to Employer Pro ($199/month)', async () => {
      const res = await request(app)
        .post('/api/billing/subscribe')
        .set('Cookie', companyCookie)
        .send({
          plan: 'pro',
          paymentMethod: { brand: 'Mastercard', last4: '8842', expMonth: 10, expYear: 2028 }
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.plan, 'pro');
      assert.equal(res.body.data.amountFormatted, '$199.00');

      // Verify company plan is updated
      const billingRes = await request(app)
        .get('/api/billing/company')
        .set('Cookie', companyCookie);

      assert.equal(billingRes.body.data.company.plan, 'pro');
      assert.equal(billingRes.body.data.usage.maxActiveJobs, 50);
      assert.equal(billingRes.body.data.usage.searchTier, 'advanced');
    });

    test('Pro plan allows creating more than 3 active jobs', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Cookie', companyCookie)
        .send({
          title: '4th Job Allowed On Pro Tier',
          description: 'High capacity recruiter posting',
          budgetRange: '$100k - $140k',
          timeZoneOverlapRequirements: '5 hours EST overlap',
          requiredSkills: ['Python', 'Django']
        });

      assert.equal(res.status, 201, 'Should successfully create 4th job under Pro tier');
    });

    test('Recruiter can schedule cancellation of Pro subscription', async () => {
      const res = await request(app)
        .post('/api/billing/cancel')
        .set('Cookie', companyCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const sub = inMemoryStore.subscriptions.find(s => s.companyId === 'usr-company-001');
      assert.equal(sub.cancelAtPeriodEnd, true);
    });
  });

  describe('5. Admin Revenue & Monetization Governance', () => {
    test('GET /api/billing/admin/metrics returns consolidated revenue metrics', async () => {
      const res = await request(app)
        .get('/api/billing/admin/metrics')
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.metrics.totalPlacements >= 1);
      assert.ok(res.body.data.metrics.collectedRevenueCents >= 250000); // At least one paid placement ($2,500)
      assert.ok(res.body.data.metrics.activeProSubscriptions >= 1);
    });

    test('Non-admin users cannot access admin revenue metrics (RBAC)', async () => {
      const res = await request(app)
        .get('/api/billing/admin/metrics')
        .set('Cookie', companyCookie);

      assert.equal(res.status, 403);
    });

    test('Admin can waive a placement fee with documented reason and audit trail', async () => {
      // Create a new placement fee to waive
      const newFee = await inMemoryStore.createPlacementFee({
        companyId: 'usr-company-001',
        candidateUserId: 'usr-candidate-001',
        candidateId: 'cand-001',
        jobId: 'job-001',
        applicationId: 'app-waive-test-01',
        candidateName: 'Test Candidate',
        jobTitle: 'Backend Dev',
        feeAmountCents: 250000,
        status: 'eligible'
      });

      const res = await request(app)
        .post(`/api/billing/admin/placements/${newFee._id}/waive`)
        .set('Cookie', adminCookie)
        .send({
          reason: 'Special promotional pilot waiver approved by VP of Sales'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'waived');

      const updated = await inMemoryStore.findPlacementFeeById(newFee._id);
      assert.equal(updated.status, 'waived');
      assert.equal(updated.waivedReason, 'Special promotional pilot waiver approved by VP of Sales');
      assert.ok(updated.waivedAt);
    });

    test('Admin can export billing records as CSV', async () => {
      const res = await request(app)
        .get('/api/billing/admin/export')
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.equal(res.headers['content-type'], 'text/csv; charset=utf-8');
      assert.ok(res.text.includes('Placement ID,Company,Candidate,Role,Fee USD'));
    });
  });
});
