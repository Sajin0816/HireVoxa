import { getDbMode } from '../config/db.js';
import { Application } from '../models/Application.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { Resume } from '../models/Resume.js';
import { Interview } from '../models/Interview.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { profileCompleteness } from './candidatePortalController.js';
import { createNotificationEvent } from './notificationController.js';
import { safeRegex } from '../utils/securityUtils.js';
import {
  APPLICATION_STATUSES,
  validateStatusTransition,
  canCandidateWithdraw
} from '../services/applicationLifecycleService.js';
import { triggerHiringPlacementFee } from '../services/placementBillingService.js';

async function findCandidateByUserId(userId) {
  return getDbMode() === 'in-memory-demo'
    ? inMemoryStore.findCandidateByUserId(userId)
    : Candidate.findOne({ userId });
}

async function findCandidateById(id) {
  return getDbMode() === 'in-memory-demo'
    ? inMemoryStore.findCandidateById(id)
    : Candidate.findById(id);
}

async function findJob(id) {
  return getDbMode() === 'in-memory-demo' ? inMemoryStore.findJobById(id) : Job.findById(id);
}

async function findInterviewsForApplication(applicationId) {
  return getDbMode() === 'in-memory-demo'
    ? inMemoryStore.findInterviews({ applicationId })
    : Interview.find({ applicationId });
}

function safeJob(job) {
  if (!job) return null;
  const value = job?.toObject ? job.toObject() : { ...job };
  delete value.__v;
  return value;
}

function safeApplication(application, job = null, candidateSummary = null, isCompanyView = false, interviews = []) {
  const value = application?.toObject ? application.toObject() : { ...application };
  delete value.__v;
  delete value.candidateUserId;

  // Never expose internal notes or company-only history notes to candidates
  if (!isCompanyView) {
    delete value.internalNotes;
    if (Array.isArray(value.statusHistory)) {
      value.statusHistory = value.statusHistory.map(h => {
        const item = { ...h };
        delete item.internalNotes;
        return item;
      });
    }
  }

  const res = { ...value };
  if (job) res.job = safeJob(job);
  if (candidateSummary) res.candidate = candidateSummary;
  if (interviews && interviews.length > 0) res.interviews = interviews;
  return res;
}

export async function submitApplication(req, res, next) {
  try {
    const jobId = req.params.jobId || req.body.jobId;
    if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required.' });

    const job = await findJob(jobId);
    if (!job || job.status !== 'Open') {
      return res.status(400).json({ success: false, error: 'Applications are only accepted for published open jobs.' });
    }

    const candidate = await findCandidateByUserId(req.user.id);
    if (!candidate) {
      return res.status(400).json({ success: false, error: 'Complete your candidate profile before applying.' });
    }
    if (profileCompleteness(candidate) < 100) {
      return res.status(400).json({
        success: false,
        error: 'Complete your required profile fields before applying.',
        profileCompleteness: profileCompleteness(candidate)
      });
    }

    const resumeId = req.body.resumeId || null;
    if (resumeId) {
      const resume = getDbMode() === 'in-memory-demo'
        ? await inMemoryStore.findResumeById(resumeId)
        : await Resume.findOne({ _id: resumeId, candidateUserId: req.user.id, isActive: true });
      if (!resume || resume.candidateUserId !== req.user.id || !resume.isActive) {
        return res.status(400).json({ success: false, error: 'Selected resume is not available.' });
      }
    }

    const existing = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findApplicationByCandidateAndJob(req.user.id, String(job._id))
      : await Application.findOne({ candidateUserId: req.user.id, jobId: String(job._id) });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied to this job.',
        data: safeApplication(existing, safeJob(job), null, false)
      });
    }

    const payload = {
      candidateUserId: req.user.id,
      candidateId: String(candidate._id),
      jobId: String(job._id),
      companyId: String(job.companyId),
      resumeId,
      jobSnapshot: {
        title: job.title,
        employmentType: job.employmentType,
        minimumExperience: job.minimumExperience
      },
      coverNote: typeof req.body.coverNote === 'string' ? req.body.coverNote.trim().slice(0, 4000) : '',
      internalNotes: '',
      status: 'Submitted',
      submittedAt: new Date(),
      statusHistory: [{
        fromStatus: null,
        toStatus: 'Submitted',
        changedAt: new Date(),
        changedBy: req.user.id,
        changedByRole: 'candidate',
        reason: 'Candidate submitted application'
      }]
    };

    let application;
    try {
      application = getDbMode() === 'in-memory-demo'
        ? await inMemoryStore.createApplication(payload)
        : await Application.create(payload);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, error: 'You have already applied to this job.' });
      throw error;
    }

    // Trigger notification to hiring organization
    createNotificationEvent({
      recipientUserId: job.postedBy || job.companyId,
      recipientRole: 'company',
      companyId: String(job.companyId),
      type: 'APPLICATION_SUBMITTED',
      title: 'New Application Received',
      message: `${candidate.name} applied for "${job.title}".`,
      link: `/app/applications/${application._id}`
    }).catch(err => console.error('[Notification error]', err.message));

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      mode: getDbMode(),
      data: safeApplication(application, safeJob(job), null, false)
    });
  } catch (error) {
    next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    const isCompany = req.user.role === 'company' || req.user.role === 'admin';
    const { status, jobId, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));

    let applications = [];
    if (isCompany) {
      const companyId = req.user.companyId || req.user.id;
      const filter = { companyId };
      if (jobId) filter.jobId = jobId;
      if (status && status !== 'All') filter.status = status;
      if (search) filter.search = search;

      if (getDbMode() === 'in-memory-demo') {
        applications = await inMemoryStore.findApplications(filter);
      } else {
        const query = { companyId };
        if (jobId) query.jobId = jobId;
        if (status && status !== 'All') query.status = status;
        if (search) {
          const reg = safeRegex(search);
          if (reg) {
            query.$or = [{ 'jobSnapshot.title': reg }, { coverNote: reg }];
          }
        }
        applications = await Application.find(query).sort({ submittedAt: -1 });
      }
    } else {
      // Candidate view
      if (getDbMode() === 'in-memory-demo') {
        applications = await inMemoryStore.findApplications({ candidateUserId: req.user.id });
      } else {
        applications = await Application.find({ candidateUserId: req.user.id }).sort({ submittedAt: -1 });
      }
    }

    const total = applications.length;
    const paged = applications.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const data = [];
    for (const app of paged) {
      const job = await findJob(app.jobId);
      let candidateSummary = null;
      if (isCompany) {
        const cand = await findCandidateById(app.candidateId);
        if (cand) {
          candidateSummary = {
            id: cand._id,
            name: cand.name,
            title: cand.title,
            skills: cand.skills || [],
            yearsOfExperience: cand.yearsOfExperience,
            country: cand.country,
            location: cand.location
          };
        }
      }
      data.push(safeApplication(app, job ? safeJob(job) : null, candidateSummary, isCompany));
    }

    res.json({
      success: true,
      count: data.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      },
      mode: getDbMode(),
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplication(req, res, next) {
  try {
    const { id } = req.params;
    const application = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findApplicationById(id)
      : await Application.findById(id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const isOwner = application.candidateUserId === req.user.id;
    const companyId = req.user.companyId || req.user.id;
    const isCompanyOwner = (req.user.role === 'company' || req.user.role === 'admin') && application.companyId === companyId;

    if (!isOwner && !isCompanyOwner) {
      return res.status(403).json({ success: false, error: 'Access denied: Application is private to the applicant and hiring organization.' });
    }

    const job = await findJob(application.jobId);
    let candidateSummary = null;
    if (isCompanyOwner) {
      const cand = await findCandidateById(application.candidateId);
      if (cand) {
        candidateSummary = {
          id: cand._id,
          name: cand.name,
          title: cand.title,
          headline: cand.headline,
          skills: cand.skills || [],
          yearsOfExperience: cand.yearsOfExperience,
          country: cand.country,
          location: cand.location,
          timeZone: cand.timeZone,
          summary: cand.summary,
          workExperience: cand.workExperience || [],
          education: cand.education || []
        };
      }
    }

    const interviews = await findInterviewsForApplication(application._id);

    res.json({
      success: true,
      mode: getDbMode(),
      data: safeApplication(application, job ? safeJob(job) : null, candidateSummary, isCompanyOwner, interviews)
    });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    if (!['company', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only authorized members of the hiring organization can update application status.' });
    }

    const targetStatus = req.body.status || req.body.targetStatus;
    const { reason, internalNotes } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'Target status is required.' });
    }

    const companyId = req.user.companyId || req.user.id;
    const application = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findApplicationById(req.params.id)
      : await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (application.companyId !== companyId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot modify another organization\'s application.' });
    }

    // Validate transition using centralized lifecycle service
    try {
      validateStatusTransition(application.status, targetStatus, req.user.role);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    const historyEntry = {
      fromStatus: application.status,
      toStatus: targetStatus,
      changedAt: new Date(),
      changedBy: req.user.id,
      changedByRole: req.user.role,
      reason: reason ? String(reason).trim() : `Status moved to ${targetStatus}`,
      internalNotes: internalNotes ? String(internalNotes).trim() : ''
    };

    const updates = {
      status: targetStatus,
      statusHistory: [...(application.statusHistory || []), historyEntry]
    };
    if (internalNotes) {
      updates.internalNotes = String(internalNotes).trim();
    }

    let updated;
    if (getDbMode() === 'in-memory-demo') {
      updated = await inMemoryStore.updateApplication(application._id, updates);
    } else {
      updated = await Application.findOneAndUpdate(
        { _id: application._id, companyId },
        {
          $set: {
            status: targetStatus,
            ...(internalNotes ? { internalNotes: String(internalNotes).trim() } : {})
          },
          $push: { statusHistory: historyEntry }
        },
        { new: true, runValidators: true }
      );
    }

    // Trigger qualifying placement fee if candidate was hired
    if (targetStatus === 'Hired') {
      try {
        await triggerHiringPlacementFee({
          application: updated || application,
          actorUserId: req.user.id,
          actorRole: req.user.role
        });
      } catch (placementErr) {
        console.error('[Placement error on hire]', placementErr.message);
      }
    }

    // Notify candidate of status update
    const job = await findJob(application.jobId);
    createNotificationEvent({
      recipientUserId: application.candidateUserId,
      recipientRole: 'candidate',
      companyId: application.companyId,
      type: 'APPLICATION_STATUS_CHANGED',
      title: 'Application Status Update',
      message: `Your application for "${job?.title || 'Engineering Role'}" is now "${targetStatus}".`,
      link: `/candidate/applications/${application._id}`
    }).catch(err => console.error('[Notification error]', err.message));

    res.json({
      success: true,
      message: `Application transitioned from "${application.status}" to "${targetStatus}".`,
      mode: getDbMode(),
      data: safeApplication(updated, job, null, true)
    });
  } catch (error) {
    next(error);
  }
}

export async function withdrawApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findApplicationById(id)
      : await Application.findById(id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (application.candidateUserId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: You can only withdraw your own applications.' });
    }

    if (!canCandidateWithdraw(application.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot withdraw application currently in terminal status "${application.status}".`
      });
    }

    const historyEntry = {
      fromStatus: application.status,
      toStatus: 'Withdrawn',
      changedAt: new Date(),
      changedBy: req.user.id,
      changedByRole: 'candidate',
      reason: reason ? String(reason).trim() : 'Candidate withdrew application',
      internalNotes: ''
    };

    const updates = {
      status: 'Withdrawn',
      withdrawnAt: new Date(),
      withdrawalReason: reason ? String(reason).trim() : 'Candidate voluntarily withdrew application',
      statusHistory: [...(application.statusHistory || []), historyEntry]
    };

    let updated;
    if (getDbMode() === 'in-memory-demo') {
      updated = await inMemoryStore.updateApplication(application._id, updates);
    } else {
      updated = await Application.findOneAndUpdate(
        { _id: application._id, candidateUserId: req.user.id },
        {
          $set: {
            status: 'Withdrawn',
            withdrawnAt: updates.withdrawnAt,
            withdrawalReason: updates.withdrawalReason
          },
          $push: { statusHistory: historyEntry }
        },
        { new: true, runValidators: true }
      );
    }

    // Notify hiring company
    const job = await findJob(application.jobId);
    createNotificationEvent({
      recipientUserId: job?.postedBy || application.companyId,
      recipientRole: 'company',
      companyId: application.companyId,
      type: 'APPLICATION_WITHDRAWN',
      title: 'Application Withdrawn',
      message: `A candidate has withdrawn their application for "${job?.title || 'Engineering Role'}".`,
      link: `/app/applications/${application._id}`
    }).catch(err => console.error('[Notification error]', err.message));

    res.json({
      success: true,
      message: 'Application withdrawn successfully.',
      mode: getDbMode(),
      data: safeApplication(updated, job, null, false)
    });
  } catch (error) {
    next(error);
  }
}

export async function addInternalNote(req, res, next) {
  try {
    if (!['company', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only hiring organization members can add internal notes.' });
    }

    const { id } = req.params;
    const { note } = req.body;
    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Note text is required.' });
    }

    const companyId = req.user.companyId || req.user.id;
    const application = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findApplicationById(id)
      : await Application.findById(id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (application.companyId !== companyId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Application belongs to another organization.' });
    }

    const updatedNote = application.internalNotes
      ? `${application.internalNotes}\n\n[${new Date().toLocaleDateString()}] ${note.trim()}`
      : `[${new Date().toLocaleDateString()}] ${note.trim()}`;

    let updated;
    if (getDbMode() === 'in-memory-demo') {
      updated = await inMemoryStore.updateApplication(application._id, { internalNotes: updatedNote });
    } else {
      updated = await Application.findByIdAndUpdate(
        application._id,
        { $set: { internalNotes: updatedNote } },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Internal note added.',
      data: { internalNotes: updated.internalNotes }
    });
  } catch (error) {
    next(error);
  }
}
