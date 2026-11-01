import { getDbMode } from '../config/db.js';
import { Job } from '../models/Job.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { safeRegex } from '../utils/securityUtils.js';

export async function getAllJobs(req, res, next) {
  try {
    const { status, employmentType, search, public: isPublic, skill, seniority, timezone, location, minExperience } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();
    const isCompanyUser = req.user && (req.user.role === 'company' || req.user.role === 'admin');
    const tenantCompanyId = isCompanyUser ? (req.user.companyId || req.user.id) : null;

    if (mode === 'in-memory-demo') {
      const filter = { status: isCompanyUser && !isPublic ? status : undefined, employmentType, search, skill, seniority, timezone, location, minExperience };
      if (tenantCompanyId && !isPublic) {
        // Company workspace: return strictly this company's jobs
        filter.companyId = tenantCompanyId;
      } else {
        // Public marketplace view: only return Open jobs
        filter.onlyPublicOpen = true;
      }
      const jobs = await inMemoryStore.findJobs(filter);
      const total = jobs.length;
      const pagedJobs = jobs.slice((page - 1) * limit, page * limit);
      return res.json({
        success: true,
        count: pagedJobs.length,
        total,
        pagination: { page, limit, pages: Math.ceil(total / limit) },
        mode,
        data: pagedJobs
      });
    }

    // MongoDB mode
    const query = {};
    if (tenantCompanyId && !isPublic) {
      query.companyId = tenantCompanyId;
    } else {
      query.status = 'Open';
    }

    if (status && (tenantCompanyId && !isPublic)) query.status = status;
    if (employmentType) query.employmentType = employmentType;
    if (skill) {
      const reg = safeRegex(skill);
      if (reg) query.requiredSkills = reg;
    }
    if (seniority) query.seniority = seniority;
    if (timezone) {
      const reg = safeRegex(timezone);
      if (reg) query.$or = [{ timezone: reg }, { timeZoneOverlapRequirements: reg }];
    }
    if (location) {
      const reg = safeRegex(location);
      if (reg) query.locationRequirement = reg;
    }
    if (minExperience !== undefined && minExperience !== '') query.minimumExperience = { $gte: Number(minExperience) || 0 };
    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ title: reg }, { description: reg }, { requiredSkills: reg }];
      }
    }

    const allJobs = await Job.find(query).sort({ createdAt: -1 });
    const total = allJobs.length;
    const jobs = allJobs.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: { page, limit, pages: Math.ceil(total / limit) },
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

    // Candidate and logged-out users can only view published jobs.
    const isCompanyUser = req.user && (req.user.role === 'company' || req.user.role === 'admin');
    if (!isCompanyUser && job.status !== 'Open') {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }

    // Cross-company access validation:
    // A company cannot access another company's private (non-Open) job
    const isCompany = req.user && req.user.role === 'company';
    const tenantCompanyId = isCompany ? (req.user.companyId || req.user.id) : null;

    if (tenantCompanyId && job.companyId && job.companyId !== tenantCompanyId && job.status !== 'Open') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view another organization\'s private requisition.'
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
      seniority,
      workArrangement,
      timezone,
      status
    } = req.body;

    if (!title || !description || !budgetRange || !timeZoneOverlapRequirements) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, budgetRange, timeZoneOverlapRequirements'
      });
    }

    const effectiveCompanyId = req.user?.companyId || req.user?.id;
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
      seniority: seniority?.trim() || '',
      workArrangement: workArrangement?.trim() || 'Remote',
      timezone: timezone?.trim() || '',
      status: status || 'Open',
      companyId: effectiveCompanyId,
      postedBy: req.user?.id
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
    const effectiveCompanyId = req.user?.companyId || req.user?.id;
    const updates = { ...req.body };

    // Prevent mass assignment of tenant identity
    delete updates._id;
    delete updates.companyId;
    delete updates.postedBy;

    if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (mode === 'in-memory-demo') {
      const existing = await inMemoryStore.findJobById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Job not found with id: ${id}` });
      }
      if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot update another organization\'s requisition.' });
      }
      const updated = await inMemoryStore.updateJob(id, updates, effectiveCompanyId);
      return res.json({
        success: true,
        message: 'Job posting updated successfully',
        mode,
        data: updated
      });
    }

    const existing = await Job.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Job not found with id: ${id}` });
    }

    if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot update another organization\'s requisition.' });
    }

    const updated = await Job.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
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

export async function deleteJob(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();
    const effectiveCompanyId = req.user?.companyId || req.user?.id;

    if (mode === 'in-memory-demo') {
      const existing = await inMemoryStore.findJobById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Job not found with id: ${id}` });
      }
      if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another organization\'s requisition.' });
      }
      await inMemoryStore.deleteJob(id, effectiveCompanyId);
      return res.json({
        success: true,
        message: 'Job posting deleted successfully',
        mode
      });
    }

    const existing = await Job.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Job not found with id: ${id}` });
    }

    if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another organization\'s requisition.' });
    }

    await Job.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'Job posting deleted successfully',
      mode
    });
  } catch (error) {
    next(error);
  }
}
