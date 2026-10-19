import { getDbMode } from '../config/db.js';
import { Job } from '../models/Job.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

export async function getAllJobs(req, res, next) {
  try {
    const { status, employmentType, search } = req.query;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const jobs = await inMemoryStore.findJobs({ status, employmentType, search });
      return res.json({
        success: true,
        count: jobs.length,
        mode,
        data: jobs
      });
    }

    // MongoDB mode
    const query = {};
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;
    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [{ title: reg }, { description: reg }, { requiredSkills: reg }];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      mode,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    let job = null;
    if (mode === 'in-memory-demo') {
      job = await inMemoryStore.findJobById(id);
    } else {
      job = await Job.findById(id);
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job not found with id: ${id}`
      });
    }

    res.json({
      success: true,
      mode,
      data: job
    });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const {
      title,
      description,
      department,
      requiredSkills,
      minimumExperience,
      employmentType,
      budgetRange,
      timeZoneOverlapRequirements,
      locationRequirement,
      status
    } = req.body;

    if (!title || !description || !budgetRange || !timeZoneOverlapRequirements) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, budgetRange, timeZoneOverlapRequirements'
      });
    }

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : typeof requiredSkills === 'string'
      ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const jobPayload = {
      title: title.trim(),
      description: description.trim(),
      department: department?.trim() || 'Engineering',
      requiredSkills: skillsArray,
      minimumExperience: Number(minimumExperience) || 3,
      employmentType: employmentType || 'Full-Time',
      budgetRange: budgetRange.trim(),
      timeZoneOverlapRequirements: timeZoneOverlapRequirements.trim(),
      locationRequirement: locationRequirement || 'Remote (Latin America)',
      status: status || 'Open'
    };

    const mode = getDbMode();
    let created = null;

    if (mode === 'in-memory-demo') {
      created = await inMemoryStore.createJob(jobPayload);
    } else {
      created = await Job.create(jobPayload);
    }

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      mode,
      data: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();
    const updates = { ...req.body };

    if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }

    let updated = null;
    if (mode === 'in-memory-demo') {
      updated = await inMemoryStore.updateJob(id, updates);
    } else {
      updated = await Job.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Job not found with id: ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Job posting updated successfully',
      mode,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}
