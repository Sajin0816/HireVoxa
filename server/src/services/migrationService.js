import { Job } from '../models/Job.js';
import { Interview } from '../models/Interview.js';
import { Shortlist } from '../models/Shortlist.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { QuarantineRecord } from '../models/QuarantineRecord.js';
import { getDbMode } from '../config/db.js';
import { inMemoryStore } from './inMemoryStore.js';

/**
 * Legacy tenant migration is deliberately conservative. Records with unknown
 * ownership are quarantined by default; reassignment requires an explicit
 * verified company and an explicit allowLegacyReassignment flag.
 */
export async function runTenantMigration({ defaultCompanyId = null, allowLegacyReassignment = false } = {}) {
  const mode = getDbMode();
  const summary = {
    mode,
    jobsMigrated: 0,
    interviewsMigrated: 0,
    shortlistsMigrated: 0,
    messagesMigrated: 0,
    orphanedRecordsQuarantined: 0,
    timestamp: new Date().toISOString()
  };

  const verifiedCompany = async (companyId) => {
    if (!companyId) return false;
    if (mode === 'mongodb') {
      const user = await User.findOne({ _id: companyId, role: 'company' }).select('_id');
      return Boolean(user);
    }
    const user = await inMemoryStore.findUserById(companyId);
    return user?.role === 'company';
  };

  const quarantine = async (resourceType, record, reason) => {
    summary.orphanedRecordsQuarantined++;
    if (mode === 'mongodb') {
      await QuarantineRecord.updateOne(
        { resourceType, resourceId: String(record._id) },
        { $setOnInsert: { resourceType, resourceId: String(record._id), reason, payload: record.toObject ? record.toObject() : record } },
        { upsert: true }
      );
    } else {
      inMemoryStore.quarantine ??= [];
      if (!inMemoryStore.quarantine.some(item => item.resourceType === resourceType && item.resourceId === String(record._id))) {
        inMemoryStore.quarantine.push({ resourceType, resourceId: String(record._id), reason, payload: structuredClone(record) });
      }
    }
  };

  const explicitOwner = allowLegacyReassignment && await verifiedCompany(defaultCompanyId) ? defaultCompanyId : null;
  const resolveOwner = async (candidateOwner) => {
    if (await verifiedCompany(candidateOwner)) return candidateOwner;
    return explicitOwner;
  };

  if (mode === 'mongodb') {
    const jobs = await Job.find({ $or: [{ companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] });
    for (const job of jobs) {
      const owner = await resolveOwner(job.postedBy);
      if (!owner) { await quarantine('job', job, 'No verified company owner; manual provenance review required.'); continue; }
      job.companyId = owner;
      if (!job.postedBy) job.postedBy = owner;
      await job.save();
      summary.jobsMigrated++;
    }
    const interviews = await Interview.find({ $or: [{ companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] });
    for (const interview of interviews) {
      const owner = await resolveOwner(interview.createdBy);
      if (!owner) { await quarantine('interview', interview, 'No verified company owner; manual provenance review required.'); continue; }
      interview.companyId = owner;
      if (!interview.createdBy) interview.createdBy = owner;
      await interview.save();
      summary.interviewsMigrated++;
    }
    const shortlists = await Shortlist.find({ $or: [{ companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] });
    for (const item of shortlists) {
      const owner = await resolveOwner(item.userId);
      if (!owner) return quarantine('shortlist', item, 'No verified company owner; manual provenance review required.');
      item.companyId = owner;
      await item.save();
      summary.shortlistsMigrated++;
    }
    const messages = await Message.find({ $or: [{ companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] });
    for (const message of messages) {
      const owner = await resolveOwner(message.senderRole === 'company' ? message.senderId : null);
      if (!owner) return quarantine('message', message, 'No verified company owner; manual provenance review required.');
      message.companyId = owner;
      await message.save();
      summary.messagesMigrated++;
    }
  } else {
    for (const job of inMemoryStore.jobs.filter(item => !item.companyId)) {
      const owner = await resolveOwner(job.postedBy);
      if (!owner) { await quarantine('job', job, 'No verified company owner; manual provenance review required.'); continue; }
      job.companyId = owner;
      job.postedBy ||= owner;
      summary.jobsMigrated++;
    }
    for (const interview of inMemoryStore.interviews.filter(item => !item.companyId)) {
      const owner = await resolveOwner(interview.createdBy);
      if (!owner) { await quarantine('interview', interview, 'No verified company owner; manual provenance review required.'); continue; }
      interview.companyId = owner;
      interview.createdBy ||= owner;
      summary.interviewsMigrated++;
    }
    for (const item of inMemoryStore.shortlists.filter(record => !record.companyId)) {
      const owner = await resolveOwner(item.userId);
      if (!owner) { await quarantine('shortlist', item, 'No verified company owner; manual provenance review required.'); continue; }
      item.companyId = owner;
      summary.shortlistsMigrated++;
    }
    for (const message of inMemoryStore.messages.filter(record => !record.companyId)) {
      const owner = await resolveOwner(message.senderRole === 'company' ? message.senderId : null);
      if (!owner) { await quarantine('message', message, 'No verified company owner; manual provenance review required.'); continue; }
      message.companyId = owner;
      summary.messagesMigrated++;
    }
  }

  return summary;
}
