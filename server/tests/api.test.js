import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';
import { calculateCandidateJobMatch } from '../src/services/matchingService.js';

describe('Hirevoxa API Endpoints', () => {
  test('GET /api/health should respond with status ok and mode', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.mode);
  });

  test('GET /api/candidates should return list of Latin American engineering talent', async () => {
    const res = await request(app).get('/api/candidates');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    // Check fields of candidate
    const first = res.body.data[0];
    assert.ok(first.name);
    assert.ok(first.country);
    assert.ok(Array.isArray(first.skills));
  });

  test('GET /api/candidates/:id returns specific candidate or 404', async () => {
    const res = await request(app).get('/api/candidates/cand-001');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Rodrigo Feynman Silva');

    const notFoundRes = await request(app).get('/api/candidates/non-existent-999');
    assert.equal(notFoundRes.status, 404);
  });

  test('GET /api/jobs returns jobs and supports search query', async () => {
    const res = await request(app).get('/api/jobs');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);

    const searchRes = await request(app).get('/api/jobs?search=Front-End');
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.data.length > 0);
  });

  test('POST /api/jobs validates required fields and creates job', async () => {
    // Missing required fields
    const invalidRes = await request(app).post('/api/jobs').send({ title: 'Junior Dev' });
    assert.equal(invalidRes.status, 400);

    // Valid job creation
    const validJob = {
      title: 'Senior QA Automation Engineer',
      description: 'Lead automated testing with Playwright and Jest.',
      requiredSkills: ['TypeScript', 'Playwright', 'Jest', 'CI/CD'],
      minimumExperience: 4,
      employmentType: 'Full-Time',
      budgetRange: '$3,500 - $4,800/mo',
      timeZoneOverlapRequirements: 'EST +/- 2 hours',
      status: 'Open'
    };

    const createRes = await request(app).post('/api/jobs').send(validJob);
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.title, 'Senior QA Automation Engineer');
  });

  test('POST /api/interviews creates a pending interview record', async () => {
    const interviewData = {
      candidateId: 'cand-001',
      jobId: 'job-001',
      candidateName: 'Rodrigo Feynman Silva',
      jobTitle: 'Senior Front-End Developer',
      proposedDate: new Date().toISOString(),
      notes: 'Initial technical fit discussion.'
    };

    const res = await request(app).post('/api/interviews').send(interviewData);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.candidateName, 'Rodrigo Feynman Silva');
  });

  test('GET /api/matches/recommendations returns candidates ranked by score', async () => {
    const res = await request(app).get('/api/matches/recommendations');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].score !== undefined);
  });
});

describe('Deterministic Matching Engine', () => {
  test('calculates accurate match based on skill overlap, experience, and availability', () => {
    const mockCandidate = {
      skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS'],
      yearsOfExperience: 6,
      availability: 'Immediate',
      employmentPreference: 'Full-Time'
    };

    const mockJob = {
      requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS'],
      minimumExperience: 5,
      employmentType: 'Full-Time'
    };

    const result = calculateCandidateJobMatch(mockCandidate, mockJob);
    assert.equal(result.matchedSkills.length, 4);
    assert.equal(result.missingSkills.length, 0);
    assert.equal(result.score, 10.0); // 50 (skills) + 25 (exp) + 15 (avail) + 10 (pref) = 100 / 10 = 10.0
  });

  test('handles missing or partial skills gracefully', () => {
    const mockCandidate = {
      skills: ['React'],
      yearsOfExperience: 2,
      availability: '1 Month',
      employmentPreference: 'Contract'
    };

    const mockJob = {
      requiredSkills: ['React', 'Python', 'Go', 'Kubernetes'],
      minimumExperience: 5,
      employmentType: 'Full-Time'
    };

    const result = calculateCandidateJobMatch(mockCandidate, mockJob);
    assert.equal(result.matchedSkills.length, 1);
    assert.equal(result.missingSkills.length, 3);
    assert.ok(result.score < 5.0);
  });
});
