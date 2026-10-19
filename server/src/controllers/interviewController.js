import { getDbMode } from '../config/db.js';
import { Interview } from '../models/Interview.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

export async function getAllInterviews(req, res, next) {
  try {
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const interviews = await inMemoryStore.findInterviews();
      return res.json({
        success: true,
        count: interviews.length,
        mode,
        data: interviews
      });
    }

    const interviews = await Interview.find().sort({ createdAt: -1 });
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
    const { candidateId, jobId, candidateName, jobTitle, proposedDate, timeZone, notes, interviewerName } = req.body;

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

    const interviewPayload = {
      candidateId,
      jobId: jobId || 'general',
      candidateName,
      jobTitle: jobTitle || 'Engineering Role',
      proposedDate: parsedDate,
      timeZone: timeZone || 'EST',
      notes: notes || '',
      interviewerName: interviewerName || 'Engineering Hiring Lead',
      status: 'Pending'
    };

    const mode = getDbMode();
    let created = null;

    if (mode === 'in-memory-demo') {
      created = await inMemoryStore.createInterview(interviewPayload);
    } else {
      created = await Interview.create(interviewPayload);
    }

    res.status(201).json({
      success: true,
      message: 'Interview request submitted successfully',
      mode,
      data: created
    });
  } catch (error) {
    next(error);
  }
}
