import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { PDFDocument } from 'pdf-lib';
import app from '../src/server.js';

const password = 'Phase3Password!';
const unique = Date.now();
const candidateA = { name: 'Ana Torres', email: `ana-${unique}@example.com`, password, role: 'candidate' };
const candidateB = { name: 'Luis Gómez', email: `luis-${unique}@example.com`, password, role: 'candidate' };
let tokenA;
let tokenB;
let candidateBProfileId;
let resumeId;
let previousResumeId;
let applicationId;
let companyToken;
let otherCompanyToken;

async function register(user) {
  const response = await request(app).post('/api/auth/register').send(user);
  assert.equal(response.status, 201);
  return response.body.token;
}

describe('Phase 3 — Candidate portal, private resumes, and applications', () => {
  test('candidate accounts receive a private profile and company routes remain forbidden', async () => {
    tokenA = await register(candidateA);
    tokenB = await register(candidateB);

    const profile = await request(app).get('/api/candidates/me').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.userId, undefined);
    assert.equal(profile.body.data.name, candidateA.name);
    const profileB = await request(app).get('/api/candidates/me').set('Authorization', `Bearer ${tokenB}`);
    candidateBProfileId = profileB.body.data._id;
    const crossProfile = await request(app).get(`/api/candidates/${candidateBProfileId}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(crossProfile.status, 403);

    const loggedOut = await request(app).get('/api/candidates/me');
    assert.equal(loggedOut.status, 401);

    const companyOnly = await request(app).post('/api/jobs').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Nope', description: 'Nope', budgetRange: '$1', timeZoneOverlapRequirements: 'EST' });
    assert.equal(companyOnly.status, 403);
  });

  test('profile updates validate and persist only allowed candidate fields', async () => {
    const invalid = await request(app).patch('/api/candidates/me').set('Authorization', `Bearer ${tokenA}`).send({ yearsOfExperience: 100, role: 'company', companyId: 'other-company' });
    assert.equal(invalid.status, 400);

    const response = await request(app).patch('/api/candidates/me').set('Authorization', `Bearer ${tokenA}`).send({
      name: candidateA.name,
      title: 'Senior React Engineer',
      headline: 'Product-minded frontend engineer',
      summary: 'I build accessible, reliable web products for distributed teams.',
      country: 'Colombia',
      city: 'Bogota',
      timeZone: 'UTC-5 / EST overlap',
      skills: ['React', 'TypeScript', 'Node.js'],
      yearsOfExperience: 7,
      seniority: 'Senior',
      availability: '2 Weeks',
      employmentPreference: 'Full-Time',
      githubUrl: 'https://github.com/ana'
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.completeness, 100);
    assert.equal(response.body.data.role, undefined);

    const persisted = await request(app).get('/api/candidates/me').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(persisted.body.data.title, 'Senior React Engineer');
    assert.deepEqual(persisted.body.data.skills, ['React', 'TypeScript', 'Node.js']);
  });

  test('resume upload validates signatures and prevents cross-candidate access', async () => {
    const bad = await request(app).post('/api/candidates/me/resume').set('Authorization', `Bearer ${tokenA}`).attach('resume', Buffer.from('not a pdf'), 'resume.pdf');
    assert.equal(bad.status, 400);
    const oversized = await request(app).post('/api/candidates/me/resume').set('Authorization', `Bearer ${tokenA}`).attach('resume', Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(5 * 1024 * 1024)]), 'large.pdf');
    assert.equal(oversized.status, 413);

    const pdf = await PDFDocument.create();
    pdf.addPage([300, 400]);
    const uploaded = await request(app).post('/api/candidates/me/resume').set('Authorization', `Bearer ${tokenA}`).attach('resume', Buffer.from(await pdf.save()), 'Ana Resume.pdf');
    assert.equal(uploaded.status, 201);
    resumeId = uploaded.body.data._id;
    assert.equal(uploaded.body.data.storageKey, undefined);

    const ownMetadata = await request(app).get('/api/candidates/me/resume').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(ownMetadata.status, 200);
    assert.equal(ownMetadata.body.data._id, resumeId);

    const foreignDownload = await request(app).get(`/api/candidates/resume/${resumeId}`).set('Authorization', `Bearer ${tokenB}`);
    assert.equal(foreignDownload.status, 403);
    const ownDownload = await request(app).get(`/api/candidates/resume/${resumeId}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(ownDownload.status, 200);
    assert.match(ownDownload.headers['content-disposition'], /Ana_Resume\.pdf/);
    assert.match(ownDownload.body.toString(), /%PDF/);

    const replacementPdf = await PDFDocument.create();
    replacementPdf.addPage([300, 400]);
    previousResumeId = resumeId;
    const replacement = await request(app).post('/api/candidates/me/resume').set('Authorization', `Bearer ${tokenA}`).attach('resume', Buffer.from(await replacementPdf.save()), 'Ana Resume v2.pdf');
    assert.equal(replacement.status, 201);
    assert.equal(replacement.body.data.version, 2);
    resumeId = replacement.body.data._id;
    const oldDownload = await request(app).get(`/api/candidates/resume/${previousResumeId}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(oldDownload.status, 404);
  });

  test('job discovery excludes private jobs and applications bind relationships server-side', async () => {
    const jobs = await request(app).get('/api/jobs').set('Authorization', `Bearer ${tokenA}`).query({ limit: 50 });
    assert.equal(jobs.status, 200);
    assert.ok(jobs.body.data.every((job) => job.status === 'Open'));

    const submitted = await request(app).post('/api/applications').set('Authorization', `Bearer ${tokenA}`).send({ jobId: 'job-001', candidateId: 'candidate-bogus', companyId: 'company-bogus', resumeId, status: 'Hired', coverNote: 'Interested in the product.' });
    assert.equal(submitted.status, 201);
    applicationId = submitted.body.data._id;
    assert.equal(submitted.body.data.candidateUserId, undefined);
    assert.equal(submitted.body.data.status, 'Submitted');
    assert.equal(submitted.body.data.companyId, 'usr-company-001');

    const companyLogin = await request(app).post('/api/auth/demo-login').send({ role: 'company' });
    companyToken = companyLogin.body.token;
    otherCompanyToken = await register({ name: 'Other Company', email: `other-company-${unique}@example.com`, password, role: 'company', companyName: 'Other Company' });
    const hiringPartyDownload = await request(app).get(`/api/candidates/resume/${resumeId}`).set('Authorization', `Bearer ${companyToken}`);
    assert.equal(hiringPartyDownload.status, 200);
    const unrelatedCompanyDownload = await request(app).get(`/api/candidates/resume/${resumeId}`).set('Authorization', `Bearer ${otherCompanyToken}`);
    assert.equal(unrelatedCompanyDownload.status, 403);

    const duplicate = await request(app).post('/api/jobs/job-001/applications').set('Authorization', `Bearer ${tokenA}`).send({ resumeId });
    assert.equal(duplicate.status, 409);
    const ownApplications = await request(app).get('/api/applications').set('Authorization', `Bearer ${tokenA}`);
    assert.equal(ownApplications.status, 200);
    assert.equal(ownApplications.body.data.length, 1);
    const foreignApplication = await request(app).get(`/api/applications/${applicationId}`).set('Authorization', `Bearer ${tokenB}`);
    assert.equal(foreignApplication.status, 403);
  });

  test('candidate cannot change application status and can delete their resume', async () => {
    const statusChange = await request(app).patch(`/api/applications/${applicationId}/status`).set('Authorization', `Bearer ${tokenA}`).send({ status: 'Hired' });
    assert.equal(statusChange.status, 403);
    const deleted = await request(app).delete(`/api/candidates/me/resume/${resumeId}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(deleted.status, 200);
    const unavailable = await request(app).get(`/api/candidates/resume/${resumeId}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(unavailable.status, 404);
  });
});
