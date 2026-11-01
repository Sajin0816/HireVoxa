import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { getDbMode } from '../config/db.js';
import { Candidate } from '../models/Candidate.js';
import { Resume } from '../models/Resume.js';
import { Application } from '../models/Application.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { deleteResumeFile, getResumeStorageMode, readResume, saveResume } from '../services/resumeStorage.js';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const allowedFields = [
  'name', 'title', 'headline', 'country', 'city', 'location', 'timeZone', 'skills',
  'yearsOfExperience', 'seniority', 'availability', 'employmentPreference',
  'compensationExpectation', 'summary', 'portfolioUrl', 'githubUrl', 'linkedinUrl',
  'desiredRole', 'desiredEmploymentType', 'desiredCompensation', 'startDate',
  'workExperience', 'education'
];

function profileCompleteness(profile) {
  const checks = [
    Boolean(profile.name?.trim()),
    Boolean(profile.title?.trim()),
    Boolean(profile.summary?.trim()),
    Boolean(profile.timeZone?.trim()),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    typeof profile.yearsOfExperience === 'number' && profile.yearsOfExperience >= 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function cleanProfile(profile) {
  const value = profile?.toObject ? profile.toObject() : { ...profile };
  delete value.__v;
  delete value.userId;
  delete value.consentStatus;
  delete value.currentResumeId;
  return { ...value, completeness: profileCompleteness(value) };
}

function normalizeUrl(value, field) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 2048) throw Object.assign(new Error(`${field} must be a URL.`), { status: 400 });
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    return parsed.toString();
  } catch {
    const error = new Error(`${field} must be a valid http(s) URL.`);
    error.status = 400;
    throw error;
  }
}

function buildProfileUpdates(body, current) {
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  for (const field of ['name', 'title', 'headline', 'country', 'city', 'location', 'timeZone', 'seniority', 'availability', 'employmentPreference', 'compensationExpectation', 'summary', 'desiredRole', 'desiredEmploymentType', 'desiredCompensation', 'startDate']) {
    if (updates[field] !== undefined) {
      if (typeof updates[field] !== 'string') throw Object.assign(new Error(`${field} must be text.`), { status: 400 });
      updates[field] = updates[field].trim();
      if (updates[field].length > 5000) throw Object.assign(new Error(`${field} is too long.`), { status: 400 });
    }
  }

  if (updates.skills !== undefined) {
    if (!Array.isArray(updates.skills) || updates.skills.length > 50 || updates.skills.some(s => typeof s !== 'string' || s.length > 80)) throw Object.assign(new Error('skills must contain at most 50 text entries, each up to 80 characters.'), { status: 400 });
    updates.skills = [...new Set(updates.skills.map(skill => skill.trim()).filter(Boolean))];
  }

  if (updates.yearsOfExperience !== undefined) {
    if (updates.yearsOfExperience !== null && (typeof updates.yearsOfExperience !== 'number' || !Number.isFinite(updates.yearsOfExperience) || updates.yearsOfExperience < 0 || updates.yearsOfExperience > 70)) {
      throw Object.assign(new Error('yearsOfExperience must be between 0 and 70.'), { status: 400 });
    }
  }

  for (const field of ['portfolioUrl', 'githubUrl', 'linkedinUrl']) {
    if (updates[field] !== undefined) updates[field] = normalizeUrl(updates[field], field);
  }

  for (const field of ['workExperience', 'education']) {
    if (updates[field] !== undefined && (!Array.isArray(updates[field]) || updates[field].length > 20)) {
      throw Object.assign(new Error(`${field} must be an array with at most 20 entries.`), { status: 400 });
    }
    if (updates[field]) {
      const keys = field === 'education' ? ['institution', 'degree', 'field', 'graduationYear'] : ['company', 'role', 'startDate', 'endDate', 'description'];
      updates[field] = updates[field].map(entry => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw Object.assign(new Error(`Invalid ${field} entry.`), { status: 400 });
        return Object.fromEntries(keys.map(key => {
          const value = entry[key] ?? '';
          if (typeof value !== 'string' || value.length > 2000) throw Object.assign(new Error(`Invalid ${field}.${key}.`), { status: 400 });
          return [key, value.trim()];
        }));
      });
    }
  }
  if (updates.availability !== undefined && !['', 'Immediate', '2 Weeks', '1 Month', 'More than 1 Month'].includes(updates.availability)) throw Object.assign(new Error('Invalid availability.'), { status: 400 });
  if (updates.employmentPreference !== undefined && !['Any', 'Full-Time', 'Contract', 'Part-Time'].includes(updates.employmentPreference)) throw Object.assign(new Error('Invalid employment preference.'), { status: 400 });
  return { ...(current.toObject ? current.toObject() : current), ...updates };
}

async function getOwnCandidate(req) {
  const mode = getDbMode();
  if (mode === 'in-memory-demo') return inMemoryStore.findCandidateByUserId(req.user.id);
  return Candidate.findOne({ userId: req.user.id });
}

async function ensureOwnCandidate(req) {
  const existing = await getOwnCandidate(req);
  if (existing) return existing;
  const profile = {
    userId: req.user.id,
    name: req.user.name || 'Candidate',
    title: '',
    yearsOfExperience: null,
    skills: [],
    profileVisibility: 'Private'
  };
  if (getDbMode() === 'in-memory-demo') return inMemoryStore.createCandidate(profile);
  return Candidate.findOneAndUpdate({ userId: req.user.id }, { $setOnInsert: profile }, { upsert: true, new: true, runValidators: true });
}

export async function getMyProfile(req, res, next) {
  try {
    const candidate = await ensureOwnCandidate(req);
    res.json({ success: true, mode: getDbMode(), data: cleanProfile(candidate, true) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const candidate = await ensureOwnCandidate(req);
    const merged = buildProfileUpdates(req.body, candidate);
    if (!merged.name || !merged.title || !merged.timeZone) {
      return res.status(400).json({ success: false, error: 'Name, professional title, and timezone are required.' });
    }

    const updates = {};
    for (const field of allowedFields) if (merged[field] !== undefined) updates[field] = merged[field];
    if (profileCompleteness(merged) === 100) {
      updates.profileVisibility = 'Active';
    }
    if (getDbMode() === 'in-memory-demo') {
      const updated = await inMemoryStore.updateCandidate(candidate._id, updates);
      return res.json({ success: true, message: 'Profile saved successfully.', mode: getDbMode(), data: cleanProfile(updated, true) });
    }
    const updated = await Candidate.findOneAndUpdate({ _id: candidate._id, userId: req.user.id }, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile saved successfully.', mode: getDbMode(), data: cleanProfile(updated, true) });
  } catch (error) {
    next(error);
  }
}

async function validateUploadedFile(file) {
  if (!file || !file.buffer) throw Object.assign(new Error('A PDF resume is required.'), { status: 400 });
  if (file.size > MAX_RESUME_BYTES) throw Object.assign(new Error('Resume must be 5 MB or smaller.'), { status: 400 });
  const originalName = path.basename(file.originalname || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160);
  if (!originalName.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf' || !/^%PDF-1\.[0-9]/.test(file.buffer.subarray(0, 8).toString()) || !/%%EOF\s*$/.test(file.buffer.subarray(-1024).toString())) {
    throw Object.assign(new Error('Upload a valid PDF resume (maximum 5 MB).'), { status: 400 });
  }
  try {
    const document = await PDFDocument.load(file.buffer, { throwOnInvalidObject: true });
    if (document.getPageCount() < 1 || document.getPageCount() > 100) throw new Error('Invalid page count');
    // Reject active content and embedded files; never execute or render uploads server-side.
    for (const [, object] of document.context.enumerateIndirectObjects()) {
      if (/\/(JavaScript|JS|OpenAction|AA|Launch|EmbeddedFiles|RichMedia)\b/.test(object.toString())) throw new Error('Active content');
    }
  } catch {
    throw Object.assign(new Error('Resume must be an unencrypted, readable PDF without active content (1–100 pages).'), { status: 400 });
  }
  return { originalName, extension: 'pdf' };
}

function publicResume(resume) {
  const value = resume?.toObject ? resume.toObject() : { ...resume };
  delete value.storageKey;
  delete value.__v;
  return value;
}

export async function getMyResume(req, res, next) {
  try {
    const resume = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findActiveResumeByCandidate(req.user.id)
      : await Resume.findOne({ candidateUserId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, mode: getDbMode(), storageMode: getResumeStorageMode(), data: resume ? publicResume(resume) : null });
  } catch (error) {
    next(error);
  }
}

export async function uploadMyResume(req, res, next) {
  let savedFile = null;
  try {
    const candidate = await ensureOwnCandidate(req);
    const { originalName, extension } = await validateUploadedFile(req.file);
    savedFile = await saveResume(req.file.buffer, extension);
    const existing = getDbMode() === 'in-memory-demo'
      ? await inMemoryStore.findActiveResumeByCandidate(req.user.id)
      : await Resume.findOne({ candidateUserId: req.user.id, isActive: true });
    const version = existing ? Number(existing.version || 1) + 1 : 1;
    const metadata = {
      candidateUserId: req.user.id,
      candidateId: String(candidate._id),
      storageKey: savedFile.storageKey,
      originalName,
      mimeType: extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: req.file.size,
      version,
      isActive: true
    };
    let created;
    if (getDbMode() === 'in-memory-demo') {
      if (existing) await inMemoryStore.deactivateResume(existing._id);
      created = await inMemoryStore.createResume(metadata, req.file.buffer);
      await inMemoryStore.updateCandidate(candidate._id, { currentResumeId: created._id });
    } else {
      created = await Resume.create(metadata);
      if (existing) {
        existing.isActive = false;
        await existing.save();
      }
      await Candidate.updateOne({ _id: candidate._id, userId: req.user.id }, { $set: { currentResumeId: String(created._id) } });
    }
    if (existing?.storageKey) await deleteResumeFile(existing.storageKey);
    res.status(201).json({ success: true, message: 'Resume uploaded securely.', mode: getDbMode(), storageMode: getResumeStorageMode(), data: publicResume(created) });
  } catch (error) {
    if (savedFile?.storageKey) await deleteResumeFile(savedFile.storageKey).catch(() => {});
    next(error);
  }
}

async function loadResume(id) {
  return getDbMode() === 'in-memory-demo' ? inMemoryStore.findResumeById(id) : Resume.findById(id);
}

export async function downloadResume(req, res, next) {
  try {
    const resume = await loadResume(req.params.id);
    if (!resume || !resume.isActive) return res.status(404).json({ success: false, error: 'Resume not found.' });
    const isOwner = resume.candidateUserId === req.user.id;
    let isHiringParty = false;
    if (req.user.role === 'company' || req.user.role === 'admin') {
      const filter = getDbMode() === 'in-memory-demo'
        ? await inMemoryStore.findApplications({ companyId: req.user.companyId || req.user.id })
        : await Application.find({ companyId: req.user.companyId || req.user.id, resumeId: String(resume._id) });
      isHiringParty = filter.some(application => String(application.resumeId) === String(resume._id));
    }
    if (!isOwner && !isHiringParty) return res.status(403).json({ success: false, error: 'Access denied: this resume is private.' });

    const buffer = getDbMode() === 'in-memory-demo'
      ? inMemoryStore.resumeFiles.get(resume._id)
      : await readResume(resume.storageKey);
    if (!buffer) return res.status(404).json({ success: false, error: 'Resume file is unavailable.' });
    const filename = path.basename(resume.originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    res.set({ 'Content-Type': resume.mimeType, 'Content-Length': buffer.length, 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' });
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function deleteMyResume(req, res, next) {
  try {
    const resume = req.params.id
      ? await loadResume(req.params.id)
      : (getDbMode() === 'in-memory-demo'
        ? await inMemoryStore.findActiveResumeByCandidate(req.user.id)
        : await Resume.findOne({ candidateUserId: req.user.id, isActive: true }).sort({ createdAt: -1 }));
    if (!resume || resume.candidateUserId !== req.user.id) return res.status(404).json({ success: false, error: 'Resume not found.' });
    if (getDbMode() === 'in-memory-demo') {
      await inMemoryStore.deleteResume(resume._id);
      const candidate = await inMemoryStore.findCandidateByUserId(req.user.id);
      if (candidate) await inMemoryStore.updateCandidate(candidate._id, { currentResumeId: null });
    } else {
      await Resume.findOneAndUpdate({ _id: resume._id, candidateUserId: req.user.id }, { $set: { isActive: false, deletedAt: new Date() } });
      await Candidate.updateOne({ userId: req.user.id, currentResumeId: String(resume._id) }, { $set: { currentResumeId: null } });
    }
    await deleteResumeFile(resume.storageKey);
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export { profileCompleteness };
