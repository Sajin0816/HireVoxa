import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';
import { inMemoryStore } from '../src/services/inMemoryStore.js';

describe('Phase 4.5 — Secure Operations Admin Panel Test Suite', () => {
  let ownerToken = '';
  let opsToken = '';
  let analystToken = '';
  let candidateToken = '';
  let companyToken = '';

  before(async () => {
    await connectDB();
    inMemoryStore.reset();

    // Platform Owner login
    const ownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@hirevoxa.internal', password: 'password123' });
    assert.equal(ownerRes.status, 200);
    assert.equal(ownerRes.body.user.role, 'admin');
    assert.equal(ownerRes.body.user.adminRole, 'owner');
    ownerToken = ownerRes.body.token;

    // Operations Admin login
    const opsRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ops@hirevoxa.internal', password: 'password123' });
    assert.equal(opsRes.status, 200);
    assert.equal(opsRes.body.user.adminRole, 'ops_admin');
    opsToken = opsRes.body.token;

    // Read-only Analyst login
    const analystRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@hirevoxa.internal', password: 'password123' });
    assert.equal(analystRes.status, 200);
    assert.equal(analystRes.body.user.adminRole, 'analyst');
    analystToken = analystRes.body.token;

    // Candidate login
    const candRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rodrigo@hirevoxa-latam.dev', password: 'password123' });
    assert.equal(candRes.status, 200);
    candidateToken = candRes.body.token;

    // Company login
    const compRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'richardfeynman@gmail.com', password: 'password123' });
    assert.equal(compRes.status, 200);
    companyToken = compRes.body.token;
  });

  test('1. RBAC Access Control: Non-admin rejection and token security', async () => {
    // Unauthenticated request rejected
    const unauthRes = await request(app).get('/api/admin/summary');
    assert.equal(unauthRes.status, 401);

    // Candidate request rejected with 403 Forbidden
    const candAccess = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(candAccess.status, 403);

    // Company request rejected with 403 Forbidden
    const compAccess = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${companyToken}`);
    assert.equal(compAccess.status, 403);

    // Public registration prevents privilege escalation: rejecting admin role
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker Admin',
        email: 'attacker@evil.com',
        password: 'password123',
        role: 'admin',
        adminRole: 'owner'
      });
    assert.equal(regRes.status, 400);
    assert.match(regRes.body.error, /A new account must be either a company or candidate account/i);
  });

  test('2. Overview Dashboard: Aggregation across real records', async () => {
    const summaryRes = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.body.success, true);
    assert.ok(summaryRes.body.data.users.total >= 5);
    assert.ok(summaryRes.body.data.jobs.total >= 1);
    assert.ok(summaryRes.body.data.companies.total >= 1);
    assert.ok(Array.isArray(summaryRes.body.data.auditLogs.recent));
  });

  test('3. Read-only Analyst permissions and mutation blocking', async () => {
    // Analyst CAN read summary
    const readSummary = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${analystToken}`);
    assert.equal(readSummary.status, 200);

    // Analyst CAN read users list
    const readUsers = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${analystToken}`);
    assert.equal(readUsers.status, 200);

    // Analyst CANNOT mutate user status (403 Forbidden)
    const mutateUser = await request(app)
      .patch('/api/admin/users/usr-candidate-001/status')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ status: 'suspended', reason: 'Test' });
    assert.equal(mutateUser.status, 403);
    assert.match(mutateUser.body.message || mutateUser.body.error, /Read-only Analysts cannot perform.*operations/i);

    // Analyst CANNOT verify company (403 Forbidden)
    const mutateComp = await request(app)
      .patch('/api/admin/companies/usr-company-001/verify')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ verificationStatus: 'verified' });
    assert.equal(mutateComp.status, 403);

    // Analyst CANNOT moderate job (403 Forbidden)
    const mutateJob = await request(app)
      .patch('/api/admin/jobs/job-001/moderate')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ moderationStatus: 'approved' });
    assert.equal(mutateJob.status, 403);
  });

  test('4. User Management: Suspension, reactivation, and last-owner protection', async () => {
    // Platform Owner cannot suspend their own account
    const selfSuspend = await request(app)
      .patch('/api/admin/users/usr-admin-001/status')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'suspended', reason: 'Self suspension attempt' });
    assert.equal(selfSuspend.status, 400);

    // Operations admin cannot suspend Platform Owner
    const opsSuspendOwner = await request(app)
      .patch('/api/admin/users/usr-admin-001/status')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ status: 'suspended', reason: 'Ops suspending owner' });
    assert.equal(opsSuspendOwner.status, 403);

    // Platform Owner suspends candidate account
    const suspendRes = await request(app)
      .patch('/api/admin/users/usr-candidate-001/status')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'suspended', reason: 'Suspected fraudulent profile' });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.user.status, 'suspended');

    // Suspended candidate login fails with 403 Account Suspended
    const loginSuspended = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rodrigo@hirevoxa-latam.dev', password: 'password123' });
    assert.equal(loginSuspended.status, 403);
    assert.match(loginSuspended.body.message || loginSuspended.body.error, /Account suspended/i);

    // Suspended candidate token is rejected by authMiddleware protect
    const protectedCall = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    assert.equal(protectedCall.status, 403);

    // Reactivate candidate account
    const reactivateRes = await request(app)
      .patch('/api/admin/users/usr-candidate-001/status')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'active', reason: 'Identity verified' });
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.body.user.status, 'active');

    // Candidate can log in again
    const loginReactivated = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rodrigo@hirevoxa-latam.dev', password: 'password123' });
    assert.equal(loginReactivated.status, 200);
  });

  test('5. User Role Management: Owner-only permissions and last-owner protection', async () => {
    // Ops admin cannot change roles (403)
    const opsRoleChange = await request(app)
      .patch('/api/admin/users/usr-candidate-001/role')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ role: 'admin', adminRole: 'owner' });
    assert.equal(opsRoleChange.status, 403);

    // Owner cannot demote the last remaining Platform Owner
    const demoteLastOwner = await request(app)
      .patch('/api/admin/users/usr-admin-001/role')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'candidate', adminRole: null });
    assert.equal(demoteLastOwner.status, 400);
    assert.match(demoteLastOwner.body.message, /Cannot demote the last remaining Platform Owner/i);
  });

  test('6. Company Management & Verification Workflow', async () => {
    // Rejection without mandatory reason fails with 400
    const rejectNoReason = await request(app)
      .patch('/api/admin/companies/usr-company-001/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ verificationStatus: 'rejected', reason: '' });
    assert.equal(rejectNoReason.status, 400);

    // Valid verification with reason succeeds
    const verifyRes = await request(app)
      .patch('/api/admin/companies/usr-company-001/verify')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ verificationStatus: 'verified', reason: 'Reviewed IRS EIN document' });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.company.verificationStatus, 'verified');

    // Verification history is updated
    const history = verifyRes.body.company.verificationHistory;
    assert.ok(history.length >= 1);
    assert.equal(history[history.length - 1].reason, 'Reviewed IRS EIN document');
  });

  test('7. Job Moderation: States, mandatory reasons, and audit trail', async () => {
    // Suspend without reason fails with 400
    const suspendNoReason = await request(app)
      .patch('/api/admin/jobs/job-001/moderate')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ moderationStatus: 'suspended', reason: '' });
    assert.equal(suspendNoReason.status, 400);

    // Suspend with reason succeeds
    const suspendRes = await request(app)
      .patch('/api/admin/jobs/job-001/moderate')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ moderationStatus: 'suspended', reason: 'Misleading compensation terms' });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.job.moderationStatus, 'suspended');

    // Approve job succeeds
    const approveRes = await request(app)
      .patch('/api/admin/jobs/job-001/moderate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ moderationStatus: 'approved', reason: 'Compliance issue resolved' });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.job.moderationStatus, 'approved');
  });

  test('8. Operational Oversight: Applications and Recruiter privacy notes', async () => {
    // Create an application with internal feedback notes
    const appRecord = await inMemoryStore.createApplication({
      jobId: 'job-001',
      candidateId: 'cand-001',
      candidateUserId: 'usr-candidate-001',
      candidateName: 'Rodrigo Feynman Silva',
      candidateEmail: 'rodrigo@hirevoxa-latam.dev',
      jobTitle: 'Senior Full Stack Engineer',
      companyId: 'usr-company-001',
      status: 'submitted',
      feedbackNotes: 'Confidential recruiter notes: high salary expectations'
    });

    // Ops Admin gets application list — feedbackNotes are masked
    const opsAppRes = await request(app)
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${opsToken}`);
    assert.equal(opsAppRes.status, 200);
    const targetApp = opsAppRes.body.applications.find(a => a._id === appRecord._id);
    assert.ok(targetApp);
    assert.equal(targetApp.feedbackNotes, '[Masked for Non-Owner Privacy]');

    // Platform Owner gets application list — feedbackNotes are preserved
    const ownerAppRes = await request(app)
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(ownerAppRes.status, 200);
    const ownerTargetApp = ownerAppRes.body.applications.find(a => a._id === appRecord._id);
    assert.ok(ownerTargetApp);
    assert.equal(ownerTargetApp.feedbackNotes, 'Confidential recruiter notes: high salary expectations');
  });

  test('9. Append-Only Audit Logs: Verification of recorded actions', async () => {
    const logsRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(logsRes.status, 200);
    assert.ok(logsRes.body.logs.length > 0);

    const actions = logsRes.body.logs.map(l => l.action);
    assert.ok(actions.includes('USER_SUSPEND'));
    assert.ok(actions.includes('USER_REACTIVATE'));
    assert.ok(actions.includes('COMPANY_VERIFICATION'));
    assert.ok(actions.includes('JOB_MODERATION'));
  });

  test('10. Support & Issue Management', async () => {
    // Create ticket
    const createTicket = await request(app)
      .post('/api/admin/support-tickets')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        subject: 'Payment reconciliation inquiry',
        description: 'Candidate reported pending invoice status',
        category: 'general',
        priority: 'high'
      });
    assert.equal(createTicket.status, 201);
    const ticketId = createTicket.body.ticket._id;

    // Add internal note
    const addNote = await request(app)
      .post(`/api/admin/support-tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ note: 'Reviewed banking wire routing code' });
    assert.equal(addNote.status, 200);

    // Update status to resolved
    const updateTicket = await request(app)
      .patch(`/api/admin/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ status: 'resolved' });
    assert.equal(updateTicket.status, 200);
    assert.equal(updateTicket.body.ticket.status, 'resolved');
  });

  test('11. Platform Settings: Owner authorization check', async () => {
    // Ops admin cannot update platform settings (403)
    const opsSettings = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ allowCompanyRegistration: false });
    assert.equal(opsSettings.status, 403);

    // Platform Owner can update platform settings
    const ownerSettings = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ allowCompanyRegistration: false, requireJobModeration: true });
    assert.equal(ownerSettings.status, 200);
    assert.equal(ownerSettings.body.settings.requireJobModeration, true);
  });

  test('12. Reports & CSV Export: Formula injection protection', async () => {
    // Add malicious user with formula injection payload
    inMemoryStore.users.push({
      _id: 'usr-evil-001',
      name: '=cmd|"/C calc"!A0',
      email: '+malicious@formula.com',
      role: 'candidate',
      status: 'active',
      companyName: '@InjectedCompany',
      createdAt: new Date()
    });

    const exportRes = await request(app)
      .get('/api/admin/reports/export/users')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(exportRes.status, 200);
    assert.equal(exportRes.headers['content-type'], 'text/csv; charset=utf-8');
    const csvContent = exportRes.text;

    // Verify formula starters are neutralized by single quote prefix
    assert.ok(csvContent.includes("`'=cmd|") || csvContent.includes("\"'=cmd|"));
    assert.ok(csvContent.includes("'+malicious@formula.com"));
    assert.ok(csvContent.includes("'@InjectedCompany"));
  });
});
