import fs from 'fs/promises';
import path from 'path';
import { getDbMode } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Candidate } from '../models/Candidate.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { Shortlist } from '../models/Shortlist.js';
import { Message } from '../models/Message.js';
import { Resume } from '../models/Resume.js';

const models = { users: User, companies: Company, candidates: Candidate, jobs: Job, applications: Application, interviews: Interview, shortlists: Shortlist, messages: Message, resumes: Resume };

function ids(records) {
  return records.map(record => String(record._id));
}

function orIn(field, values) {
  return values.length ? { [field]: { $in: values } } : null;
}

/** Build a non-destructive cleanup plan from explicit isDemoRecord provenance. */
export async function planDemoCleanup() {
  if (getDbMode() !== 'mongodb') {
    return { status: 'BLOCKED', reason: 'MongoDB is not connected; no database records were inspected.', counts: {} };
  }

  const [users, companies, candidates, jobs] = await Promise.all([
    User.find({ isDemoRecord: true }).lean(),
    Company.find({ isDemoRecord: true }).lean(),
    Candidate.find({ isDemoRecord: true }).lean(),
    Job.find({ isDemoRecord: true }).lean()
  ]);
  const userIds = ids(users);
  const companyIds = [...new Set([...ids(companies), ...users.filter(user => user.role === 'company').map(user => String(user.companyId || user._id))])];
  const candidateIds = ids(candidates);
  const jobIds = ids(jobs);

  const relatedQueries = {
    applications: { $or: [orIn('candidateId', candidateIds), orIn('jobId', jobIds), orIn('companyId', companyIds)].filter(Boolean) },
    resumes: orIn('candidateId', candidateIds),
    interviews: { $or: [orIn('candidateId', candidateIds), orIn('jobId', jobIds), orIn('companyId', companyIds)].filter(Boolean) },
    shortlists: { $or: [orIn('candidateId', candidateIds), orIn('companyId', companyIds)].filter(Boolean) },
    messages: { $or: [orIn('companyId', companyIds), orIn('senderId', [...userIds, ...candidateIds]), orIn('recipientId', [...userIds, ...candidateIds])].filter(Boolean) }
  };
  const relatedEntries = await Promise.all(Object.entries(relatedQueries).map(async ([name, query]) => [name, await models[name].find(query).lean()]));
  const related = Object.fromEntries(relatedEntries);
  return {
    status: 'READY_FOR_REVIEW',
    provenance: 'explicit isDemoRecord markers and relationships to marked records',
    ids: { userIds, companyIds, candidateIds, jobIds },
    records: { users, companies, candidates, jobs, ...related },
    counts: Object.fromEntries(Object.entries({ users, companies, candidates, jobs, ...related }).map(([name, records]) => [name, records.length]))
  };
}

/**
 * Destructive cleanup requires a caller-provided confirmation and writes a JSON
 * backup before deleting only records in the reviewed plan.
 */
export async function executeDemoCleanup({ confirm = false, backupDirectory } = {}) {
  if (!confirm) throw new Error('Cleanup is dry-run by default. Set confirm=true only after reviewing the cleanup plan and backup destination.');
  const plan = await planDemoCleanup();
  if (plan.status !== 'READY_FOR_REVIEW') throw new Error(plan.reason);
  if (!backupDirectory) throw new Error('backupDirectory is required for destructive cleanup.');
  await fs.mkdir(backupDirectory, { recursive: true });
  const backupPath = path.join(backupDirectory, `hirevoxa-demo-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), plan }, null, 2), { flag: 'wx' });

  const { candidateIds, jobIds, companyIds, userIds } = plan.ids;
  const related = plan.records;
  const results = {};
  for (const [name, records] of Object.entries(related)) {
    if (!records.length) continue;
    results[name] = await models[name].deleteMany({ _id: { $in: ids(records) } });
  }
  results.resumes = await Resume.deleteMany({ _id: { $in: ids(related.resumes) } });
  results.applications = await Application.deleteMany({ _id: { $in: ids(related.applications) } });
  results.interviews = await Interview.deleteMany({ _id: { $in: ids(related.interviews) } });
  results.shortlists = await Shortlist.deleteMany({ _id: { $in: ids(related.shortlists) } });
  results.messages = await Message.deleteMany({ _id: { $in: ids(related.messages) } });
  results.jobs = await Job.deleteMany({ _id: { $in: jobIds } });
  results.candidates = await Candidate.deleteMany({ _id: { $in: candidateIds } });
  results.companies = await Company.deleteMany({ _id: { $in: companyIds } });
  results.users = await User.deleteMany({ _id: { $in: userIds } });
  return { status: 'CLEANED', backupPath, counts: Object.fromEntries(Object.entries(results).map(([name, result]) => [name, result.deletedCount || 0])) };
}
