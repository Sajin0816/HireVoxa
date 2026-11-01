import { getDbMode } from '../config/db.js';
import { Interview } from '../models/Interview.js';
import { Application } from '../models/Application.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { createNotificationEvent } from './notificationController.js';

export async function getAllInterviews(req, res, next) {
  try {
    const mode = getDbMode();
    const effectiveCompanyId = req.user?.companyId || (req.user?.role === 'company' ? req.user.id : null);
    const isCandidate = req.user?.role === 'candidate';
    const { applicationId } = req.query;

    if (mode === 'in-memory-demo') {
      const filter = {};
      if (effectiveCompanyId) filter.companyId = effectiveCompanyId;
      if (isCandidate) filter.candidateId = req.user.id;
      if (applicationId) filter.applicationId = applicationId;
      const interviews = await inMemoryStore.findInterviews(filter);
      return res.json({
        success: true,
        count: interviews.length,
        mode,
        data: interviews
      });
    }

    const query = {};
    if (effectiveCompanyId) query.companyId = effectiveCompanyId;
    if (isCandidate) query.candidateId = req.user.id;
    if (applicationId) query.applicationId = applicationId;

    const interviews = await Interview.find(query).sort({ proposedDate: 1, createdAt: -1 });
    res.json({
      success: true,
      count: interviews.length,
      mode,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
}

export async function createInterview(req, res, next) {
  try {
    const {
      candidateId,
      jobId,
      applicationId,
      candidateName,
      jobTitle,
      interviewType,
      proposedDate,
      scheduledEndTime,
      timeZone,
      meetingLink,
      notes,
      interviewerName
    } = req.body;

    if (!candidateId || !candidateName || !proposedDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required interview fields: candidateId, candidateName, proposedDate'
      });
    }

    const parsedDate = new Date(proposedDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposedDate format. Please provide a valid ISO date string.'
      });
    }

    const effectiveCompanyId = req.user?.companyId || req.user?.id;
    const mode = getDbMode();

    let candidateRecipientUserId = candidateId;

    // Validate application association if provided
    if (applicationId) {
      const application = mode === 'in-memory-demo'
        ? await inMemoryStore.findApplicationById(applicationId)
        : await Application.findById(applicationId);

      if (!application) {
        return res.status(404).json({ success: false, error: 'Linked application not found.' });
      }

      if (application.companyId !== effectiveCompanyId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: Application belongs to another organization.' });
      }

      candidateRecipientUserId = application.candidateUserId;

      // Automatically move application to 'Interview' stage if appropriate
      if (['Submitted', 'Under Review', 'Shortlisted'].includes(application.status)) {
        const historyEntry = {
          fromStatus: application.status,
          toStatus: 'Interview',
          changedAt: new Date(),
          changedBy: req.user.id,
          changedByRole: 'company',
          reason: 'Interview scheduled by hiring team'
        };

        if (mode === 'in-memory-demo') {
          await inMemoryStore.updateApplication(application._id, {
            status: 'Interview',
            statusHistory: [...(application.statusHistory || []), historyEntry]
          });
        } else {
          await Application.findByIdAndUpdate(application._id, {
            $set: { status: 'Interview' },
            $push: { statusHistory: historyEntry }
          });
        }
      }
    }

    const interviewPayload = {
      candidateId,
      jobId: jobId || 'general',
      applicationId: applicationId || null,
      candidateName,
      jobTitle: jobTitle || 'Engineering Role',
      interviewType: interviewType || 'Technical Interview',
      proposedDate: parsedDate,
      scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : null,
      timeZone: timeZone || 'EST',
      meetingLink: meetingLink || '',
      notes: notes || '',
      interviewerName: interviewerName || req.user?.name || 'Engineering Hiring Lead',
      companyId: effectiveCompanyId,
      createdBy: req.user?.id,
      status: 'Pending'
    };

    let created = null;
    if (mode === 'in-memory-demo') {
      created = await inMemoryStore.createInterview(interviewPayload);
    } else {
      created = await Interview.create(interviewPayload);
    }

    // Trigger notification to candidate
    createNotificationEvent({
      recipientUserId: candidateRecipientUserId,
      recipientRole: 'candidate',
      companyId: effectiveCompanyId,
      type: 'INTERVIEW_SCHEDULED',
      title: 'Interview Scheduled',
      message: `An interview for "${jobTitle || 'Engineering Role'}" has been scheduled for ${parsedDate.toLocaleDateString()}.`,
      link: applicationId ? `/candidate/applications/${applicationId}` : '/candidate/jobs'
    }).catch(err => console.error('[Notification error]', err.message));

    res.status(201).json({
      success: true,
      message: 'Interview request scheduled successfully',
      mode,
      data: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, proposedDate, scheduledEndTime, timeZone, meetingLink } = req.body;
    const mode = getDbMode();
    const effectiveCompanyId = req.user?.companyId || (req.user?.role === 'company' ? req.user.id : null);
    const isCandidate = req.user?.role === 'candidate';

    const allowedUpdates = {};
    if (status !== undefined) allowedUpdates.status = status;
    if (notes !== undefined) allowedUpdates.notes = notes;
    if (proposedDate !== undefined) allowedUpdates.proposedDate = new Date(proposedDate);
    if (scheduledEndTime !== undefined) allowedUpdates.scheduledEndTime = new Date(scheduledEndTime);
    if (timeZone !== undefined) allowedUpdates.timeZone = timeZone;
    if (meetingLink !== undefined) allowedUpdates.meetingLink = meetingLink;

    if (mode === 'in-memory-demo') {
      const existing = await inMemoryStore.findInterviewById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Interview not found with id: ${id}` });
      }
      if (effectiveCompanyId && existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot modify another organization\'s interview.' });
      }
      if (isCandidate && existing.candidateId !== req.user.id && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot modify another candidate\'s interview.' });
      }
      const updated = await inMemoryStore.updateInterview(id, allowedUpdates, effectiveCompanyId);

      // Notify counterparty
      const recipientUserId = isCandidate ? existing.companyId : existing.candidateId;
      const recipientRole = isCandidate ? 'company' : 'candidate';
      createNotificationEvent({
        recipientUserId,
        recipientRole,
        companyId: existing.companyId,
        type: 'INTERVIEW_UPDATED',
        title: 'Interview Status Update',
        message: `Interview status for "${existing.jobTitle}" changed to "${status || 'Updated'}".`,
        link: isCandidate ? `/app/interviews` : `/candidate/jobs`
      }).catch(err => console.error('[Notification error]', err.message));

      return res.json({
        success: true,
        message: 'Interview status updated successfully',
        mode,
        data: updated
      });
    }

    const existing = await Interview.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Interview not found with id: ${id}` });
    }

    if (effectiveCompanyId && existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot modify another organization\'s interview.' });
    }
    if (isCandidate && existing.candidateId !== req.user.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot modify another candidate\'s interview.' });
    }

    const updated = await Interview.findByIdAndUpdate(id, allowedUpdates, { new: true, runValidators: true });

    // Notify counterparty
    const recipientUserId = isCandidate ? existing.companyId : existing.candidateId;
    const recipientRole = isCandidate ? 'company' : 'candidate';
    createNotificationEvent({
      recipientUserId,
      recipientRole,
      companyId: existing.companyId,
      type: 'INTERVIEW_UPDATED',
      title: 'Interview Status Update',
      message: `Interview status for "${existing.jobTitle}" changed to "${status || 'Updated'}".`,
      link: isCandidate ? `/app/interviews` : `/candidate/jobs`
    }).catch(err => console.error('[Notification error]', err.message));

    res.json({
      success: true,
      message: 'Interview status updated successfully',
      mode,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInterview(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();
    const effectiveCompanyId = req.user?.companyId || req.user?.id;

    if (mode === 'in-memory-demo') {
      const existing = await inMemoryStore.findInterviewById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Interview not found with id: ${id}` });
      }
      if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another organization\'s interview.' });
      }
      await inMemoryStore.deleteInterview(id, effectiveCompanyId);
      return res.json({
        success: true,
        message: 'Interview deleted successfully',
        mode
      });
    }

    const existing = await Interview.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Interview not found with id: ${id}` });
    }

    if (existing.companyId && existing.companyId !== effectiveCompanyId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another organization\'s interview.' });
    }

    await Interview.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'Interview deleted successfully',
      mode
    });
  } catch (error) {
    next(error);
  }
}
