import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';

describe('Phase 2B — Tenant Isolation Suite (Company A vs Company B)', () => {
  const ts = Date.now();
  const companyAEmail = `comp_a_${ts}@alpha.io`;
  const companyBEmail = `comp_b_${ts}@beta.io`;
  const candidateEmail = `cand_${ts}@latam.dev`;
  const password = 'StrongPassword@2026';

  let tokenA = '';
  let tokenB = '';
  let tokenCand = '';
  let userA = null;
  let userB = null;
  let jobAId = '';
  let jobBId = '';
  let interviewAId = '';
  let interviewBId = '';

  test('Setup: Register Company A, Company B, and Candidate', async () => {
    // 1. Company A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Vance',
        email: companyAEmail,
        password,
        role: 'company',
        companyName: 'Alpha Technologies'
      });
    assert.equal(resA.status, 201);
    tokenA = resA.body.token;
    userA = resA.body.user;
    assert.ok(userA._id);

    // 2. Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Miller',
        email: companyBEmail,
        password,
        role: 'company',
        companyName: 'Beta Dynamics'
      });
    assert.equal(resB.status, 201);
    tokenB = resB.body.token;
    userB = resB.body.user;
    assert.ok(userB._id);
    assert.notEqual(userA._id, userB._id);

    // 3. Candidate
    const resCand = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Mendoza',
        email: candidateEmail,
        password,
        role: 'candidate'
      });
    assert.equal(resCand.status, 201);
    tokenCand = resCand.body.token;
  });

  // 1 & 2: Requisitions Creation & Isolation
  test('1. Company A creates private Draft job; Company B creates Open job', async () => {
    const resA = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Alpha Secret Architect',
        description: 'Classified internal systems design.',
        department: 'Special Projects',
        requiredSkills: ['Rust', 'Distributed Systems'],
        minimumExperience: 7,
        budgetRange: '$10,000 - $12,000/mo',
        timeZoneOverlapRequirements: 'EST (6 hrs)',
        status: 'Draft'
      });
    assert.equal(resA.status, 201);
    assert.equal(resA.body.data.companyId, userA._id);
    jobAId = resA.body.data._id;

    const resB = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Beta Cloud Specialist',
        description: 'Scalable Kubernetes deployments.',
        department: 'Cloud',
        requiredSkills: ['Kubernetes', 'Go'],
        minimumExperience: 5,
        budgetRange: '$6,000 - $8,000/mo',
        timeZoneOverlapRequirements: 'EST (4 hrs)',
        status: 'Open'
      });
    assert.equal(resB.status, 201);
    assert.equal(resB.body.data.companyId, userB._id);
    jobBId = resB.body.data._id;
  });

  test('2. Company A job list contains only Job A; does not contain Job B', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(res.status, 200);
    const ids = res.body.data.map(j => j._id);
    assert.ok(ids.includes(jobAId), 'Company A must see Job A');
    assert.equal(ids.includes(jobBId), false, 'Company A must NOT see Company B job');
  });

  test('3. Company B job list contains only Job B; does not contain Job A', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(res.status, 200);
    const ids = res.body.data.map(j => j._id);
    assert.ok(ids.includes(jobBId), 'Company B must see Job B');
    assert.equal(ids.includes(jobAId), false, 'Company B must NOT see Company A job');
  });

  test('4. Company A cannot read Company B\'s private job by changing ID', async () => {
    // If Company B creates a Draft job
    const draftRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Beta Confidential Role',
        description: 'Confidential R&D',
        budgetRange: '$9,000',
        timeZoneOverlapRequirements: 'EST',
        status: 'Draft'
      });
    const betaDraftId = draftRes.body.data._id;

    // Company A attempts to view Company B's private draft job
    const res = await request(app)
      .get(`/api/jobs/${betaDraftId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(res.status, 403, 'Must return 403 Forbidden for cross-company private job');
  });

  test('5. Company A cannot update Company B\'s job', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${jobBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Hacked by Company A' });

    assert.equal(res.status, 403, 'Must return 403 Forbidden when updating another company job');

    // Confirm job B title was NOT altered
    const verifyRes = await request(app).get(`/api/jobs/${jobBId}`);
    assert.equal(verifyRes.body.data.title, 'Beta Cloud Specialist');
  });

  test('6. Company A cannot delete Company B\'s job', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${jobBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 403, 'Must return 403 Forbidden when deleting another company job');

    // Confirm job B still exists
    const verifyRes = await request(app).get(`/api/jobs/${jobBId}`);
    assert.equal(verifyRes.status, 200);
  });

  // 7-11: Interview Isolation
  test('7. Company A creates Interview A; Company B creates Interview B', async () => {
    const resA = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        candidateId: 'cand-001',
        jobId: jobAId,
        candidateName: 'Rodrigo Feynman Silva',
        jobTitle: 'Alpha Secret Architect',
        proposedDate: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Alpha technical screening'
      });
    assert.equal(resA.status, 201);
    assert.equal(resA.body.data.companyId, userA._id);
    interviewAId = resA.body.data._id;

    const resB = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        candidateId: 'cand-002',
        jobId: jobBId,
        candidateName: 'Camila Fernandez',
        jobTitle: 'Beta Cloud Specialist',
        proposedDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        notes: 'Beta technical screening'
      });
    assert.equal(resB.status, 201);
    assert.equal(resB.body.data.companyId, userB._id);
    interviewBId = resB.body.data._id;
  });

  test('8. Company A list interviews returns Interview A; does not return Interview B', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(res.status, 200);
    const ids = res.body.data.map(i => i._id);
    assert.ok(ids.includes(interviewAId), 'Company A must see Interview A');
    assert.equal(ids.includes(interviewBId), false, 'Company A must NOT see Interview B');
  });

  test('9. Company B list interviews returns Interview B; does not return Interview A', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(res.status, 200);
    const ids = res.body.data.map(i => i._id);
    assert.ok(ids.includes(interviewBId), 'Company B must see Interview B');
    assert.equal(ids.includes(interviewAId), false, 'Company B must NOT see Interview A');
  });

  test('10. Company A cannot update Company B\'s interview', async () => {
    const res = await request(app)
      .patch(`/api/interviews/${interviewBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'Cancelled', notes: 'Tampered by Company A' });

    assert.equal(res.status, 403, 'Must return 403 Forbidden for cross-company interview update');
  });

  test('11. Company A cannot delete Company B\'s interview', async () => {
    const res = await request(app)
      .delete(`/api/interviews/${interviewBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 403, 'Must return 403 Forbidden for cross-company interview delete');
  });

  // 12: Shortlist Isolation
  test('12. Company A shortlists candidate; Company B list does not see Company A shortlist', async () => {
    // Company A shortlists cand-003
    const slRes = await request(app)
      .post('/api/shortlists/toggle')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ candidateId: 'cand-003', notes: 'Alpha exclusive interest' });
    assert.equal(slRes.status, 200);

    // Company B list shortlists
    const bList = await request(app)
      .get('/api/shortlists')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(bList.status, 200);
    const candidateIds = bList.body.data.map(s => s.candidateId);
    assert.equal(candidateIds.includes('cand-003'), false, 'Company B must not see Company A shortlisted candidate');
  });

  // 13: Message Isolation
  test('13. Company A private messages are not accessible to Company B', async () => {
    const convId = `conv_private_${ts}`;
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        conversationId: convId,
        recipientId: 'cand-001',
        content: 'Alpha confidential offer details'
      });
    assert.equal(msgRes.status, 201);

    // Company B queries messages for that conversation
    const bRes = await request(app)
      .get(`/api/messages?conversationId=${convId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(bRes.status, 200);
    assert.equal(bRes.body.data.length, 0, 'Company B must receive empty array for Company A conversation');
  });

  // 14: Metrics & Analytics Isolation
  test('14. Company A metrics aggregate only Company A jobs and interviews', async () => {
    const resA = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(resA.status, 200);
    // Company A created 1 job and 1 interview
    assert.equal(resA.body.data.totalJobs, 1, 'Company A totalJobs must reflect only Company A jobs');
    assert.equal(resA.body.data.totalInterviews, 1, 'Company A totalInterviews must reflect only Company A interviews');

    const resB = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.equal(resB.status, 200);
    // Company B created 2 jobs and 1 interview
    assert.equal(resB.body.data.totalJobs, 2, 'Company B totalJobs must reflect only Company B jobs');
    assert.equal(resB.body.data.totalInterviews, 1, 'Company B totalInterviews must reflect only Company B interviews');
  });

  // 15: Forged Tenant Identity Injection
  test('15. Forged companyId in request body is ignored; server enforces authenticated token identity', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Spoof Attempt Role',
        description: 'Attempting to inject Company B ID in payload',
        budgetRange: '$5,000',
        timeZoneOverlapRequirements: 'EST',
        companyId: userB._id // Forged companyId
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.companyId, userA._id, 'Server must bind companyId to token userA, ignoring body companyId');
    assert.notEqual(res.body.data.companyId, userB._id);
  });

  // 16: Safe Nonexistent ID Handling
  test('16. Nonexistent job and interview IDs return safe 404', async () => {
    const jRes = await request(app)
      .delete('/api/jobs/nonexistent-id-99999')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(jRes.status, 404);

    const iRes = await request(app)
      .delete('/api/interviews/nonexistent-int-99999')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.equal(iRes.status, 404);
  });

  // 17: Candidate Access Rejection
  test('17. Candidate account is forbidden from accessing company-private resources', async () => {
    const jRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenCand}`)
      .send({ title: 'Candidate Job', description: 'desc', budgetRange: '$5k', timeZoneOverlapRequirements: 'EST' });
    assert.equal(jRes.status, 403);

    const mRes = await request(app)
      .get('/api/reports/metrics')
      .set('Authorization', `Bearer ${tokenCand}`);
    assert.equal(mRes.status, 403);
  });
});
