import { getDbMode } from '../config/db.js';
import { Candidate } from '../models/Candidate.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

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
        employmentPreference
      });
      return res.json({
        success: true,
        count: candidates.length,
        mode,
        data: candidates
      });
    }

    // MongoDB mode
    const query = { profileVisibility: { $ne: 'Private' } };

    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [{ name: reg }, { title: reg }, { skills: reg }, { country: reg }];
    }
    if (skill) {
      query.skills = new RegExp(skill, 'i');
    }
    if (experience) {
      const exp = parseInt(experience, 10);
      if (!isNaN(exp)) query.yearsOfExperience = { $gte: exp };
    }
    if (availability) {
      query.availability = availability;
    }
    if (country) {
      query.country = new RegExp(country, 'i');
    }
    if (employmentPreference) {
      query.employmentPreference = employmentPreference;
    }

    const candidates = await Candidate.find(query).sort({ yearsOfExperience: -1 });

    res.json({
      success: true,
      count: candidates.length,
      mode,
      data: candidates
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

    res.json({
      success: true,
      mode,
      data: candidate
    });
  } catch (error) {
    next(error);
  }
}
