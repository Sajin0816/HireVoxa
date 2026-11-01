import { getDbMode } from '../config/db.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { rankCandidatesForJob, calculateCandidateJobMatch } from '../services/matchingService.js';

export async function getJobMatches(req, res, next) {
  try {
    const { jobId } = req.params;
    const mode = getDbMode();
    const companyId = req.user?.companyId || req.user?.id;

    let job = null;
    let candidates = [];

    if (mode === 'in-memory-demo') {
      job = await inMemoryStore.findJobById(jobId);
      candidates = await inMemoryStore.findCandidates({ onlyPublic: true });
    } else {
      job = await Job.findById(jobId);
      candidates = await Candidate.find({ profileVisibility: 'Active' });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job not found with id: ${jobId}`
      });
    }
    if (req.user?.role === 'company' && job.companyId !== companyId) {
      return res.status(403).json({ success: false, error: 'Access denied: job belongs to another organization.' });
    }

    const matches = rankCandidatesForJob(candidates, job);

    res.json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        requiredSkills: job.requiredSkills,
        minimumExperience: job.minimumExperience
      },
      count: matches.length,
      mode,
      data: matches
    });
  } catch (error) {
    next(error);
  }
}

export async function getTopRecommendations(req, res, next) {
  try {
    const mode = getDbMode();
    const companyId = req.user?.companyId || req.user?.id;
    let jobs = [];
    let candidates = [];

    if (mode === 'in-memory-demo') {
      jobs = await inMemoryStore.findJobs({ status: 'Open', companyId });
      candidates = await inMemoryStore.findCandidates({ onlyPublic: true });
    } else {
      jobs = await Job.find({ status: 'Open', companyId });
      candidates = await Candidate.find({ profileVisibility: 'Active' });
    }

    if (jobs.length === 0) {
      return res.json({
        success: true,
        count: 0,
        mode,
        data: [],
        message: 'Recommendations require at least one published job.'
      });
    }

    // For each candidate, find their best matching open job
    const recommendations = candidates.map(candidate => {
      let bestMatch = null;
      let highestScore = -1;

      jobs.forEach(job => {
        const match = calculateCandidateJobMatch(candidate, job);
        if (match.score > highestScore) {
          highestScore = match.score;
          bestMatch = {
            candidate,
            jobId: job._id,
            jobTitle: job.title,
            ...match
          };
        }
      });

      return bestMatch;
    }).filter(Boolean);

    // Sort descending by match score
    recommendations.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      count: recommendations.length,
      mode,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
}
