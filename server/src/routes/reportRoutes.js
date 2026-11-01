import express from 'express';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { Interview } from '../models/Interview.js';
import { getDbMode } from '../config/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', protect, authorize('company', 'admin'), async (req, res, next) => {
  try {
    const isMongo = getDbMode() === 'mongodb';
    const companyId = req.user.companyId || req.user.id;
    let candidates = [];
    let jobs = [];
    let interviews = [];

    if (isMongo) {
      candidates = await Candidate.find({ profileVisibility: 'Active' });
      jobs = await Job.find({ companyId });
      interviews = await Interview.find({ companyId });
    } else {
      candidates = await inMemoryStore.findCandidates({ onlyPublic: true });
      jobs = await inMemoryStore.findJobs({ companyId });
      interviews = await inMemoryStore.findInterviews({ companyId });
    }

    // Compute distribution by country
    const countryDistribution = {};
    candidates.forEach((c) => {
      const country = c.country || 'Unknown';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });

    // Compute skills distribution
    const skillCounts = {};
    candidates.forEach((c) => {
      (c.skills || []).forEach((s) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });

    // Top skills
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // Job status breakdown (tenant-scoped)
    const jobStatuses = {
      Open: jobs.filter((j) => j.status === 'Open').length,
      Trial: jobs.filter((j) => j.status === 'Trial').length,
      Fulfilled: jobs.filter((j) => j.status === 'Fulfilled').length,
      'On Hold': jobs.filter((j) => j.status === 'On Hold').length,
      Draft: jobs.filter((j) => j.status === 'Draft').length
    };

    // Interview status breakdown (tenant-scoped)
    const interviewStatuses = {
      Pending: interviews.filter((i) => i.status === 'Pending').length,
      Confirmed: interviews.filter((i) => i.status === 'Confirmed').length,
      Completed: interviews.filter((i) => i.status === 'Completed').length,
      Cancelled: interviews.filter((i) => i.status === 'Cancelled').length
    };

    res.json({
      success: true,
      data: {
        totalCandidates: candidates.length,
        totalJobs: jobs.length,
        totalInterviews: interviews.length,
        countryDistribution: Object.entries(countryDistribution).map(([country, count]) => ({ country, count })),
        topSkills,
        jobStatuses,
        interviewStatuses
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
