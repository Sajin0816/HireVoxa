import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import { inMemoryStore } from '../src/services/inMemoryStore.js';
import { validateStatusTransition, canCandidateWithdraw } from '../src/services/applicationLifecycleService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Phase 4 — Complete Hiring Workflow & Application Lifecycle Suite', () => {
  let companyAToken;
  let companyBToken;
  let candidate1Token;
  let candidate2Token;
  let openJobA;
  let openJobB;
  let closedJob;

  before(async () => {
    inMemoryStore.reset();

    companyAToken = createToken({
      id: 'usr-company-001',
      role: 'company',
      companyId: 'usr-company-001',
      email: 'companyA@hirevoxa.internal'
    });

    companyBToken = createToken({
      id: 'usr-company-002',
      role: 'company',
      companyId: 'usr-company-002',
      email: 'companyB@hirevoxa.internal'
    });

    candidate1Token = createToken({
      id: 'usr-cand-101',
      role: 'candidate',
      email: 'candidate1@hirevoxa-latam.dev'
    });

    candidate2Token = createToken({
      id: 'usr-cand-102',
      role: 'candidate',
      email: 'candidate2@hirevoxa-latam.dev'
    });

    // Create 100% complete profiles for candidates
    await inMemoryStore.createCandidate({
      userId: 'usr-cand-101',
      name: 'Sofia Valenzuela',
      title: 'Senior Distributed Systems Engineer',
      headline: 'Go & Rust Backend Specialist',
      country: 'Chile',
      city: 'Santiago',
      location: 'Santiago, Chile',
      timeZone: 'CLT (UTC-3)',
      skills: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes'],
      yearsOfExperience: 6,
      seniority: 'Senior',
      availability: 'Immediate',
      employmentPreference: 'Full-Time',
      compensationExpectation: '$7,500/mo',
      summary: 'Experienced backend systems architect specializing in high-throughput engines.',
      portfolioUrl: 'https://sofia.dev',
      githubUrl: 'https://github.com/sofiaval',
      linkedinUrl: 'https://linkedin.com/in/sofiaval',
      workExperience: [{ company: 'FinTech LatAm', role: 'Staff Backend Engineer', duration: '3 yrs' }]
    });

    await inMemoryStore.createCandidate({
      userId: 'usr-cand-102',
      name: 'Mateo Morales',
      title: 'Full Stack React & Node Engineer',
      headline: 'TypeScript & Cloud Native Developer',
      country: 'Colombia',
      city: 'Bogota',
      location: 'Bogota, Colombia',
      timeZone: 'COT (UTC-5)',
      skills: ['React', 'Node.js', 'TypeScript', 'GraphQL'],
      yearsOfExperience: 5,
      seniority: 'Mid-Senior',
      availability: '2 Weeks Notice',
      employmentPreference: 'Full-Time',
      compensationExpectation: '$6,000/mo',
      summary: 'Full stack product engineer building responsive SaaS platforms.',
      portfolioUrl: 'https://mateo.dev',
      githubUrl: 'https://github.com/mateom',
      linkedinUrl: 'https://linkedin.com/in/mateom',
      workExperience: [{ company: 'CloudApp Colombia', role: 'Full Stack Engineer', duration: '2 yrs' }]
    });

    // Create test jobs for Company A and Company B
    openJobA = await inMemoryStore.createJob({
      companyId: 'usr-company-001',
      postedBy: 'usr-company-001',
      title: 'Senior Distributed Backend Engineer',
      description: 'Building next-generation distributed transaction systems.',
      department: 'Infrastructure',
      requiredSkills: ['Go', 'PostgreSQL', 'Docker'],
      minimumExperience: 5,
      budgetRange: '$7,000 - $8,500/mo',
      timeZoneOverlapRequirements: 'EST',
      status: 'Open'
    });

    openJobB = await inMemoryStore.createJob({
      companyId: 'usr-company-002',
      postedBy: 'usr-company-002',
      title: 'React Design System Specialist',
      description: 'Developing high-performance design system components.',
      department: 'Frontend',
      requiredSkills: ['React', 'TypeScript'],
      minimumExperience: 4,
      budgetRange: '$5,500 - $7,000/mo',
      timeZoneOverlapRequirements: 'EST',
      status: 'Open'
    });

    closedJob = await inMemoryStore.createJob({
      companyId: 'usr-company-001',
      postedBy: 'usr-company-001',
      title: 'Archived Requisition',
      description: 'Role has been filled.',
      department: 'Engineering',
      requiredSkills: ['Python'],
      minimumExperience: 3,
      budgetRange: '$5,000',
      timeZoneOverlapRequirements: 'EST',
      status: 'Closed'
    });
  });

  test('1. Candidate submits valid application to an Open job', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({
        jobId: openJobA._id,
        coverNote: 'I have 6 years of experience building Go distributed architectures.'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data._id);
    assert.equal(res.body.data.status, 'Submitted');
    assert.equal(res.body.data.jobId, openJobA._id);
    assert.equal(res.body.data.companyId, 'usr-company-001');
    assert.ok(res.body.data.submittedAt);
  });

  test('2. Duplicate application to same job by same candidate is rejected with 409', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({
        jobId: openJobA._id,
        coverNote: 'Duplicate attempt'
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('already applied'));
  });

  test('3. Application to a closed or non-existent job is rejected with 400', async () => {
    // Closed job
    const resClosed = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({ jobId: closedJob._id });

    assert.equal(resClosed.status, 400);
    assert.ok(resClosed.body.error.includes('published open jobs'));

    // Non-existent job
    const resNonExistent = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({ jobId: 'non-existent-job-id-999' });

    assert.equal(resNonExistent.status, 400);
  });

  test('4. Company A views application inbox filtered by its own requisitions', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${companyAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1);

    const appItem = res.body.data.find(a => a.jobId === openJobA._id);
    assert.ok(appItem);
    assert.equal(appItem.companyId, 'usr-company-001');
    assert.equal(appItem.status, 'Submitted');
    assert.ok(appItem.candidate);
    assert.equal(appItem.candidate.name, 'Sofia Valenzuela');
  });

  test('5. Company A advances application status: Submitted -> Under Review -> Shortlisted', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobA._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    const appId = appsRes.body.data[0]._id;

    // Transition 1: Submitted -> Under Review
    const resReview = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ status: 'Under Review', reason: 'Initial resume screening passed' });

    assert.equal(resReview.status, 200);
    assert.equal(resReview.body.data.status, 'Under Review');

    // Transition 2: Under Review -> Shortlisted
    const resShortlist = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ status: 'Shortlisted', reason: 'High match on Go & Docker' });

    assert.equal(resShortlist.status, 200);
    assert.equal(resShortlist.body.data.status, 'Shortlisted');
  });

  test('6. Invalid state transition is rejected by lifecycle service (e.g. Shortlisted directly to Hired)', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobA._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    const appId = appsRes.body.data[0]._id;

    // Attempt invalid jump: Shortlisted -> Hired (must be Offered first)
    const resInvalid = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ status: 'Hired' });

    assert.equal(resInvalid.status, 400);
    assert.equal(resInvalid.body.success, false);
    assert.ok(resInvalid.body.error.includes('cannot transition'));
  });

  test('7. Company A schedules interview linked to application, automatically syncing status to Interview', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobA._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    const appRecord = appsRes.body.data[0];
    const interviewDate = new Date(Date.now() + 86400000 * 3).toISOString();

    const resInterview = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({
        candidateId: appRecord.candidateId,
        jobId: appRecord.jobId,
        applicationId: appRecord._id,
        candidateName: appRecord.candidate.name,
        jobTitle: appRecord.job.title,
        interviewType: 'System Architecture',
        proposedDate: interviewDate,
        timeZone: 'EST',
        notes: 'Discuss distributed consensus algorithms and database sharding.',
        interviewerName: 'Chief Architect'
      });

    assert.equal(resInterview.status, 201);
    assert.equal(resInterview.body.success, true);
    assert.ok(resInterview.body.data._id);
    assert.equal(resInterview.body.data.applicationId, appRecord._id);

    // Verify application status updated to 'Interview'
    const appDetailRes = await request(app)
      .get(`/api/applications/${appRecord._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    assert.equal(appDetailRes.body.data.status, 'Interview');
    assert.ok(appDetailRes.body.data.interviews);
    assert.equal(appDetailRes.body.data.interviews.length, 1);
    assert.equal(appDetailRes.body.data.interviews[0].interviewType, 'System Architecture');
  });

  test('8. Candidate 1 views application detail: internal company notes are strictly hidden', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobA._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    const appId = appsRes.body.data[0]._id;

    // Company adds internal note
    await request(app)
      .post(`/api/applications/${appId}/notes`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ note: 'Candidate asks for $7.5k. Approved by VP of Engineering.' });

    // Candidate views application detail
    const candViewRes = await request(app)
      .get(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${candidate1Token}`);

    assert.equal(candViewRes.status, 200);
    assert.equal(candViewRes.body.data.status, 'Interview');
    assert.equal(candViewRes.body.data.internalNotes, undefined, 'Candidate must not see company internal notes');

    // Confirm company view DOES see the internal notes
    const compViewRes = await request(app)
      .get(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    assert.ok(compViewRes.body.data.internalNotes.includes('Approved by VP of Engineering'));
  });

  test('9. Candidate 2 applies to Job B and voluntarily withdraws application with a reason', async () => {
    // Candidate 2 applies to Job B
    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidate2Token}`)
      .send({
        jobId: openJobB._id,
        coverNote: 'Experienced React developer ready to contribute.'
      });

    assert.equal(applyRes.status, 201);
    const appId = applyRes.body.data._id;

    // Candidate 2 withdraws application
    const withdrawRes = await request(app)
      .post(`/api/applications/${appId}/withdraw`)
      .set('Authorization', `Bearer ${candidate2Token}`)
      .send({ reason: 'Accepted another offer with higher compensation' });

    assert.equal(withdrawRes.status, 200);
    assert.equal(withdrawRes.body.data.status, 'Withdrawn');
    assert.ok(withdrawRes.body.data.withdrawnAt);
    assert.ok(withdrawRes.body.data.withdrawalReason.includes('Accepted another offer'));

    // Company cannot transition a Withdrawn application (terminal status)
    const companyAttemptRes = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({ status: 'Interview' });

    assert.equal(companyAttemptRes.status, 400);
    assert.ok(companyAttemptRes.body.error.includes('terminal'));
  });

  test('10. Cross-Tenant Security: Company B cannot view, modify, or schedule interviews for Company A applications', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobA._id}`)
      .set('Authorization', `Bearer ${companyAToken}`);

    const companyAAppId = appsRes.body.data[0]._id;

    // Company B attempts to read Company A application detail -> 403
    const crossReadRes = await request(app)
      .get(`/api/applications/${companyAAppId}`)
      .set('Authorization', `Bearer ${companyBToken}`);

    assert.equal(crossReadRes.status, 403);
    assert.ok(crossReadRes.body.error.includes('Access denied'));

    // Company B attempts to update status on Company A application -> 403
    const crossUpdateRes = await request(app)
      .patch(`/api/applications/${companyAAppId}/status`)
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({ status: 'Rejected' });

    assert.equal(crossUpdateRes.status, 403);

    // Company B attempts to add internal note to Company A application -> 403
    const crossNoteRes = await request(app)
      .post(`/api/applications/${companyAAppId}/notes`)
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({ note: 'Intrusion note' });

    assert.equal(crossNoteRes.status, 403);

    // Company B attempts to schedule interview for Company A application -> 403
    const crossInterviewRes = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({
        candidateId: 'usr-cand-101',
        jobId: openJobA._id,
        applicationId: companyAAppId,
        candidateName: 'Sofia Valenzuela',
        proposedDate: new Date(Date.now() + 86400000).toISOString()
      });

    assert.equal(crossInterviewRes.status, 403);
  });

  test('11. Cross-Candidate Security: Candidate 1 cannot view or withdraw Candidate 2 application', async () => {
    const appsRes = await request(app)
      .get(`/api/applications?jobId=${openJobB._id}`)
      .set('Authorization', `Bearer ${companyBToken}`);

    const cand2AppId = appsRes.body.data[0]._id;

    // Candidate 1 attempts to read Candidate 2 application -> 403
    const crossRead = await request(app)
      .get(`/api/applications/${cand2AppId}`)
      .set('Authorization', `Bearer ${candidate1Token}`);

    assert.equal(crossRead.status, 403);

    // Candidate 1 attempts to withdraw Candidate 2 application -> 403
    const crossWithdraw = await request(app)
      .post(`/api/applications/${cand2AppId}/withdraw`)
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({ reason: 'Malicious withdrawal attempt' });

    assert.equal(crossWithdraw.status, 403);
  });

  test('12. Notifications generated for lifecycle events and scoped to authorized recipients', async () => {
    // Check Candidate 1 notifications (should have application status and interview notifications)
    const candNotifsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${candidate1Token}`);

    assert.equal(candNotifsRes.status, 200);
    assert.ok(candNotifsRes.body.data.length >= 1);
    const notif = candNotifsRes.body.data[0];
    assert.ok(notif._id);
    assert.ok(notif.title);
    assert.ok(notif.message);

    // Mark single notification read
    const markReadRes = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${candidate1Token}`);

    assert.equal(markReadRes.status, 200);
    assert.equal(markReadRes.body.data.read, true);

    // Mark all notifications read
    const markAllRes = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${candidate1Token}`);

    assert.equal(markAllRes.status, 200);

    // Candidate 2 cannot mark Candidate 1 notification as read
    const unauthorizedMarkRes = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${candidate2Token}`);

    assert.ok([403, 404].includes(unauthorizedMarkRes.status));
  });

  test('13. Unit test: validateStatusTransition rules directly', () => {
    // Company valid
    assert.equal(validateStatusTransition('Submitted', 'Under Review', 'company'), true);
    assert.equal(validateStatusTransition('Under Review', 'Shortlisted', 'company'), true);
    assert.equal(validateStatusTransition('Shortlisted', 'Offered', 'company'), true);
    assert.equal(validateStatusTransition('Offered', 'Hired', 'company'), true);

    // Company invalid: skip to Hired directly
    assert.throws(() => {
      validateStatusTransition('Submitted', 'Hired', 'company');
    }, /cannot transition/);

    // Terminal status cannot transition
    assert.throws(() => {
      validateStatusTransition('Rejected', 'Under Review', 'company');
    }, /terminal/);

    // Candidate withdrawal check
    assert.equal(canCandidateWithdraw('Submitted'), true);
    assert.equal(canCandidateWithdraw('Under Review'), true);
    assert.equal(canCandidateWithdraw('Withdrawn'), false);
    assert.equal(canCandidateWithdraw('Hired'), false);
  });
});
