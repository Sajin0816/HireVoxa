import { getDbMode } from '../config/db.js';
import { PRICING_CONFIG } from '../config/pricing.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

/**
 * Middleware: Verify if company is within its allowed active job requisition limit
 * Starter pilot limit: 3 active jobs
 * Pro tier limit: 50 active jobs
 */
export async function checkJobPostingLimit(req, res, next) {
  try {
    // Admin bypass
    if (req.user?.role === 'admin') {
      return next();
    }

    const companyId = req.user?.companyId || req.user?.id;
    if (!companyId) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Company identifier missing.' });
    }

    const mode = getDbMode();
    let plan = 'starter';
    let activeJobsCount = 0;

    if (mode === 'in-memory-demo') {
      const comp = inMemoryStore.companies.find(c => c._id === companyId || c.userId === companyId);
      if (comp?.plan) plan = comp.plan;
      activeJobsCount = inMemoryStore.jobs.filter(j => j.companyId === companyId && j.status === 'Open').length;
    } else {
      const comp = await Company.findOne({ $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] }).lean();
      if (comp?.plan) plan = comp.plan;
      activeJobsCount = await Job.countDocuments({ companyId, status: 'Open' });
    }

    const limit = plan === 'pro'
      ? PRICING_CONFIG.EMPLOYER_PRO.limits.maxActiveJobs
      : PRICING_CONFIG.EMPLOYER_STARTER.limits.maxActiveJobs;

    if (activeJobsCount >= limit) {
      return res.status(403).json({
        success: false,
        code: 'PILOT_LIMIT_REACHED',
        error: `Active requisition limit reached (${activeJobsCount}/${limit}). Upgrade to Employer Pro for expanded job capacity.`,
        plan,
        currentCount: activeJobsCount,
        limit
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Requires company to have an active Employer Pro subscription
 */
export async function requireProTier(req, res, next) {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const companyId = req.user?.companyId || req.user?.id;
    const mode = getDbMode();
    let plan = 'starter';

    if (mode === 'in-memory-demo') {
      const comp = inMemoryStore.companies.find(c => c._id === companyId || c.userId === companyId);
      if (comp?.plan) plan = comp.plan;
    } else {
      const comp = await Company.findOne({ $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] }).lean();
      if (comp?.plan) plan = comp.plan;
    }

    if (plan !== 'pro') {
      return res.status(403).json({
        success: false,
        code: 'PRO_TIER_REQUIRED',
        error: 'This feature requires an active Employer Pro subscription ($199/month).'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
