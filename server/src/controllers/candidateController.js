import { getDbMode } from '../config/db.js';
import { Candidate } from '../models/Candidate.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { safeRegex } from '../utils/securityUtils.js';

export async function getAllCandidates(req, res, next) {
  try {
    const { search, skill, experience, availability, country, employmentPreference } = req.query;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const candidates = await inMemoryStore.findCandidates({
        search,
        skill,
        experience,
        availability,
        country,
        employmentPreference,
        onlyPublic: !req.user || req.user.role !== 'candidate'
      });
      const visibleCandidates = req.user?.role === 'candidate'
        ? candidates.filter(candidate => candidate.userId === req.user.id)
        : candidates;
      return res.json({
        success: true,
        count: visibleCandidates.length,
        mode,
        data: visibleCandidates.map(({ userId, consentStatus, ...candidate }) => candidate)
      });
    }

    // MongoDB mode
    const query = req.user?.role === 'candidate' ? { userId: req.user.id } : { profileVisibility: 'Active' };

    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ name: reg }, { title: reg }, { skills: reg }, { country: reg }];
      }
    }
    if (skill) {
      const reg = safeRegex(skill);
      if (reg) query.skills = reg;
    }
    if (experience) {
      const exp = parseInt(experience, 10);
      if (!isNaN(exp)) query.yearsOfExperience = { $gte: exp };
    }
    if (availability) {
      query.availability = availability;
    }
    if (country) {
      const reg = safeRegex(country);
      if (reg) query.country = reg;
    }
    if (employmentPreference) {
      query.employmentPreference = employmentPreference;
    }

    const candidates = await Candidate.find(query).sort({ yearsOfExperience: -1 });

    res.json({
      success: true,
      count: candidates.length,
      mode,
      data: candidates.map(candidate => {
        const value = candidate.toObject();
        delete value.userId;
        delete value.consentStatus;
        return value;
      })
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    let candidate = null;
    if (mode === 'in-memory-demo') {
      candidate = await inMemoryStore.findCandidateById(id);
    } else {
      candidate = await Candidate.findById(id);
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: `Candidate not found with id: ${id}`
      });
    }

    if (req.user?.role === 'candidate' && candidate.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: candidates can only view their own private profile.' });
    }
    if ((!req.user || ['company', 'candidate'].includes(req.user.role)) && candidate.profileVisibility === 'Private' && candidate.userId !== req.user?.id) {
      return res.status(404).json({ success: false, error: 'Candidate profile not found.' });
    }

    const value = candidate.toObject ? candidate.toObject() : { ...candidate };
    delete value.userId;
    delete value.consentStatus;

    res.json({
      success: true,
      mode,
      data: value
    });
  } catch (error) {
    next(error);
  }
}
