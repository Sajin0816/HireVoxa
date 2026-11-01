import { getDbMode } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { AuditLog } from '../models/AuditLog.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { AdminSetting } from '../models/AdminSetting.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { safeRegex } from '../utils/securityUtils.js';

// Helper to record audit logs in append-only manner
export async function recordAudit(req, { action, targetType, targetId, outcome = 'SUCCESS', metadata = {} }) {
  try {
    const actorId = req.user ? (req.user._id || req.user.id) : 'system';
    const actorEmail = req.user ? req.user.email : 'system@hirevoxa.internal';
    const actorRole = req.user ? (req.user.adminRole || req.user.role) : 'system';
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers ? (req.headers['user-agent'] || '') : '';

    const mode = getDbMode();
    if (mode === 'in-memory-demo') {
      return await inMemoryStore.createAuditLog({
        actorId,
        actorEmail,
        actorRole,
        action,
        targetType,
        targetId,
        outcome,
        metadata,
        ipAddress,
        userAgent
      });
    }

    return await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId,
      outcome,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
    return null;
  }
}

// 1. Overview Dashboard Summary
export async function getAdminSummary(req, res, next) {
  try {
    const mode = getDbMode();
    if (mode === 'in-memory-demo') {
      const summary = await inMemoryStore.getAdminSummary();
      return res.json({ success: true, mode, data: summary });
    }

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      candidates,
      companies,
      admins,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      totalJobs,
      publishedJobs,
      pendingJobs,
      flaggedJobs,
      totalApps,
      pendingApps,
      totalInterviews,
      totalTickets,
      openTickets,
      totalLogs,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'admin' }),
      Company.countDocuments(),
      Company.countDocuments({ verificationStatus: 'verified' }),
      Company.countDocuments({ verificationStatus: 'pending' }),
      Job.countDocuments(),
      Job.countDocuments({ status: { $in: ['Open', 'published', 'open'] } }),
      Job.countDocuments({ moderationStatus: 'pending' }),
      Job.countDocuments({ moderationStatus: 'flagged' }),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Interview.countDocuments(),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      AuditLog.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      mode,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          candidates,
          companies,
          admins
        },
        companies: {
          total: totalCompanies,
          verified: verifiedCompanies,
          pending: pendingCompanies
        },
        jobs: {
          total: totalJobs,
          published: publishedJobs,
          pendingModeration: pendingJobs,
          flagged: flaggedJobs
        },
        applications: {
          total: totalApps,
          pendingReview: pendingApps
        },
        interviews: {
          total: totalInterviews
        },
        supportTickets: {
          total: totalTickets,
          open: openTickets
        },
        auditLogs: {
          total: totalLogs,
          recent: recentLogs
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// 2. User Management: List Users
export async function getAdminUsers(req, res, next) {
  try {
    const { role, adminRole, status, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findAdminUsers({ role, adminRole, status, search, page, limit });
      return res.json({ success: true, mode, ...result });
    }

    const query = {};
    if (role) query.role = role;
    if (adminRole) query.adminRole = adminRole;
    if (status) query.status = status;
    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ name: reg }, { email: reg }, { companyName: reg }];
      }
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      mode,
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

// User Detail
export async function getAdminUserById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const user = await inMemoryStore.findUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...safeUser } = user;
      return res.json({ success: true, mode, user: safeUser });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, mode, user });
  } catch (error) {
    next(error);
  }
}

// Suspend / Reactivate User
export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active or suspended.' });
    }

    // Safeguard: Cannot suspend own account
    if (id === String(adminId)) {
      return res.status(400).json({ success: false, message: 'Administrators cannot suspend their own account.' });
    }

    const mode = getDbMode();
    let targetUser = null;

    if (mode === 'in-memory-demo') {
      targetUser = await inMemoryStore.findUserById(id);
    } else {
      targetUser = await User.findById(id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Safeguard: Only platform owner can suspend another administrator
    if (targetUser.role === 'admin' && req.user.adminRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only a Platform Owner can modify administrator account status.' });
    }

    // Safeguard: Last platform owner protection
    if (targetUser.adminRole === 'owner' && status === 'suspended') {
      let activeOwnerCount = 0;
      if (mode === 'in-memory-demo') {
        activeOwnerCount = inMemoryStore.users.filter(u => u.adminRole === 'owner' && (u.status || 'active') === 'active').length;
      } else {
        activeOwnerCount = await User.countDocuments({ adminRole: 'owner', status: 'active' });
      }
      if (activeOwnerCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot suspend the last active Platform Owner account.' });
      }
    }

    let updatedUser = null;
    if (mode === 'in-memory-demo') {
      updatedUser = await inMemoryStore.updateUserStatus(id, { status, suspendedReason: reason });
    } else {
      targetUser.status = status;
      targetUser.suspendedReason = reason || '';
      targetUser.suspendedAt = status === 'suspended' ? new Date() : null;
      await targetUser.save();
      updatedUser = targetUser.toObject();
      delete updatedUser.password;
    }

    await recordAudit(req, {
      action: status === 'suspended' ? 'USER_SUSPEND' : 'USER_REACTIVATE',
      targetType: 'USER',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: { targetEmail: targetUser.email, reason: reason || '' }
    });

    res.json({
      success: true,
      message: `User account has been ${status === 'suspended' ? 'suspended' : 'reactivated'}.`,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

// Change User Role / Admin Role (Owner only)
export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role, adminRole } = req.body;
    const adminId = req.user._id || req.user.id;

    if (req.user.adminRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Privilege escalation rejected: Only Platform Owners can modify roles.' });
    }

    const validRoles = ['candidate', 'company', 'admin'];
    const validAdminRoles = ['owner', 'ops_admin', 'analyst', null];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    if (adminRole !== undefined && !validAdminRoles.includes(adminRole)) {
      return res.status(400).json({ success: false, message: 'Invalid adminRole.' });
    }

    const mode = getDbMode();
    let targetUser = null;
    if (mode === 'in-memory-demo') {
      targetUser = await inMemoryStore.findUserById(id);
    } else {
      targetUser = await User.findById(id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Last owner demotion safeguard
    if (targetUser.adminRole === 'owner' && (role !== 'admin' || (adminRole && adminRole !== 'owner'))) {
      let activeOwnerCount = 0;
      if (mode === 'in-memory-demo') {
        activeOwnerCount = inMemoryStore.users.filter(u => u.adminRole === 'owner' && (u.status || 'active') === 'active').length;
      } else {
        activeOwnerCount = await User.countDocuments({ adminRole: 'owner', status: 'active' });
      }
      if (activeOwnerCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the last remaining Platform Owner.' });
      }
    }

    let updatedUser = null;
    if (mode === 'in-memory-demo') {
      updatedUser = await inMemoryStore.updateUserAdminRole(id, { role, adminRole });
    } else {
      if (role) targetUser.role = role;
      if (adminRole !== undefined) targetUser.adminRole = adminRole;
      await targetUser.save();
      updatedUser = targetUser.toObject();
      delete updatedUser.password;
    }

    await recordAudit(req, {
      action: 'USER_ROLE_CHANGE',
      targetType: 'USER',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: { targetEmail: targetUser.email, newRole: role, newAdminRole: adminRole }
    });

    res.json({
      success: true,
      message: 'User role updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

// 3. Company Management & Verification
export async function getAdminCompanies(req, res, next) {
  try {
    const { verificationStatus, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findAdminCompanies({ verificationStatus, search, page, limit });
      return res.json({ success: true, mode, ...result });
    }

    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ name: reg }, { industry: reg }, { location: reg }];
      }
    }

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      mode,
      companies,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCompanyById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const company = await inMemoryStore.findCompanyById(id);
      if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
      const jobs = await inMemoryStore.findJobs({ companyId: id });
      return res.json({ success: true, mode, company, jobs });
    }

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const jobs = await Job.find({ companyId: company.userId || company._id });

    res.json({ success: true, mode, company, jobs });
  } catch (error) {
    next(error);
  }
}

export async function verifyCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { verificationStatus, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    const allowed = ['verified', 'rejected', 'correction_requested', 'pending'];
    if (!allowed.includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    if (['rejected', 'correction_requested'].includes(verificationStatus) && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: 'A mandatory reason is required when rejecting or requesting correction.' });
    }

    const mode = getDbMode();
    let updatedCompany = null;

    if (mode === 'in-memory-demo') {
      updatedCompany = await inMemoryStore.updateCompanyVerification(id, {
        verificationStatus,
        verificationReason: reason || '',
        adminId
      });
      if (!updatedCompany) return res.status(404).json({ success: false, message: 'Company not found' });
    } else {
      const company = await Company.findById(id);
      if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

      company.verificationStatus = verificationStatus;
      company.verificationReason = reason || '';
      company.verifiedBy = adminId;
      company.verifiedAt = new Date();
      if (!company.verificationHistory) company.verificationHistory = [];
      company.verificationHistory.push({
        status: verificationStatus,
        reason: reason || '',
        actionBy: adminId,
        createdAt: new Date()
      });
      await company.save();
      updatedCompany = company;
    }

    await recordAudit(req, {
      action: 'COMPANY_VERIFICATION',
      targetType: 'COMPANY',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: { verificationStatus, reason: reason || '' }
    });

    res.json({
      success: true,
      message: `Company status changed to ${verificationStatus}.`,
      company: updatedCompany
    });
  } catch (error) {
    next(error);
  }
}

// 4. Job Moderation
export async function getAdminJobs(req, res, next) {
  try {
    const { moderationStatus, status, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findAdminJobs({ moderationStatus, status, search, page, limit });
      return res.json({ success: true, mode, ...result });
    }

    const query = {};
    if (moderationStatus) query.moderationStatus = moderationStatus;
    if (status) query.status = status;
    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ title: reg }, { company: reg }, { location: reg }];
      }
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      mode,
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminJobById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const job = await inMemoryStore.findAdminJobById(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.json({ success: true, mode, job });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, mode, job });
  } catch (error) {
    next(error);
  }
}

export async function moderateJob(req, res, next) {
  try {
    const { id } = req.params;
    const { moderationStatus, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    const allowed = ['approved', 'flagged', 'suspended', 'pending'];
    if (!allowed.includes(moderationStatus)) {
      return res.status(400).json({ success: false, message: `Invalid moderation status. Must be one of: ${allowed.join(', ')}` });
    }

    if (['flagged', 'suspended'].includes(moderationStatus) && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: 'A mandatory reason is required when flagging or suspending a job.' });
    }

    const mode = getDbMode();
    let updatedJob = null;

    if (mode === 'in-memory-demo') {
      updatedJob = await inMemoryStore.moderateJob(id, { moderationStatus, moderationReason: reason || '', adminId });
      if (!updatedJob) return res.status(404).json({ success: false, message: 'Job not found' });
    } else {
      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      job.moderationStatus = moderationStatus;
      job.moderationReason = reason || '';
      job.moderatedBy = adminId;
      job.moderatedAt = new Date();
      if (!job.moderationHistory) job.moderationHistory = [];
      job.moderationHistory.push({
        status: moderationStatus,
        reason: reason || '',
        actionBy: adminId,
        createdAt: new Date()
      });
      await job.save();
      updatedJob = job;
    }

    await recordAudit(req, {
      action: 'JOB_MODERATION',
      targetType: 'JOB',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: { moderationStatus, reason: reason || '' }
    });

    res.json({
      success: true,
      message: `Job moderation status set to ${moderationStatus}.`,
      job: updatedJob
    });
  } catch (error) {
    next(error);
  }
}

// 5. Application and Hiring Workflow Oversight (Read-only operational view)
export async function getAdminApplications(req, res, next) {
  try {
    const { status, jobId, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();

    let rawApps = [];
    let total = 0;

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findAdminApplications({ status, jobId, search, page, limit });
      rawApps = result.applications;
      total = result.total;
    } else {
      const query = {};
      if (status) query.status = status;
      if (jobId) query.jobId = jobId;
      if (search) {
        const reg = safeRegex(search);
        if (reg) {
          query.$or = [{ candidateName: reg }, { candidateEmail: reg }, { jobTitle: reg }];
        }
      }

      total = await Application.countDocuments(query);
      rawApps = await Application.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    // Operational privacy: mask sensitive internal feedback notes unless owner
    const isOwner = req.user?.adminRole === 'owner';
    const applications = rawApps.map(app => {
      const doc = typeof app.toObject === 'function' ? app.toObject() : { ...app };
      if (!isOwner && doc.feedbackNotes) {
        doc.feedbackNotes = '[Masked for Non-Owner Privacy]';
      }
      return doc;
    });

    res.json({
      success: true,
      mode,
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

// 6. Append-Only Audit Logs Viewer
export async function getAdminAuditLogs(req, res, next) {
  try {
    const { action, actorId, targetType, targetId } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '50', 10) || 50));
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findAuditLogs({ action, actorId, targetType, targetId, page, limit });
      return res.json({ success: true, mode, ...result });
    }

    const query = {};
    if (action) query.action = action;
    if (actorId) query.actorId = actorId;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      mode,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

// 7. Support & Issue Management
export async function getAdminSupportTickets(req, res, next) {
  try {
    const { status, priority, category, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const result = await inMemoryStore.findSupportTickets({ status, priority, category, search, page, limit });
      return res.json({ success: true, mode, ...result });
    }

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      const reg = safeRegex(search);
      if (reg) {
        query.$or = [{ subject: reg }, { ticketNumber: reg }, { userEmail: reg }, { userName: reg }];
      }
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      mode,
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminSupportTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const ticket = await inMemoryStore.findSupportTicketById(id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      return res.json({ success: true, mode, ticket });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, mode, ticket });
  } catch (error) {
    next(error);
  }
}

export async function createAdminSupportTicket(req, res, next) {
  try {
    const { subject, description, category, priority, userEmail, userName } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required.' });
    }

    const mode = getDbMode();
    let ticket = null;

    if (mode === 'in-memory-demo') {
      ticket = await inMemoryStore.createSupportTicket({
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        createdBy: adminId,
        userEmail: userEmail || req.user.email,
        userName: userName || req.user.name
      });
    } else {
      const count = await SupportTicket.countDocuments();
      const ticketNumber = `TICK-${1000 + count + 1}`;
      ticket = await SupportTicket.create({
        ticketNumber,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        createdBy: adminId,
        userEmail: userEmail || req.user.email,
        userName: userName || req.user.name
      });
    }

    await recordAudit(req, {
      action: 'SUPPORT_TICKET_CREATE',
      targetType: 'SUPPORT_TICKET',
      targetId: ticket._id,
      outcome: 'SUCCESS',
      metadata: { ticketNumber: ticket.ticketNumber, subject }
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket opened.',
      ticket
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSupportTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo } = req.body;
    const mode = getDbMode();

    let updatedTicket = null;
    if (mode === 'in-memory-demo') {
      updatedTicket = await inMemoryStore.updateSupportTicket(id, { status, priority, assignedTo });
      if (!updatedTicket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    } else {
      const ticket = await SupportTicket.findById(id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
      ticket.updatedAt = new Date();
      await ticket.save();
      updatedTicket = ticket;
    }

    await recordAudit(req, {
      action: 'SUPPORT_TICKET_UPDATE',
      targetType: 'SUPPORT_TICKET',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: { status, priority, assignedTo }
    });

    res.json({
      success: true,
      message: 'Support ticket updated.',
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
}

export async function addSupportTicketNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const authorId = req.user._id || req.user.id;
    const authorName = req.user.name || 'Staff Member';

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    const mode = getDbMode();
    let ticket = null;

    if (mode === 'in-memory-demo') {
      ticket = await inMemoryStore.addSupportTicketNote(id, { note, author: authorId, authorName });
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    } else {
      ticket = await SupportTicket.findById(id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      ticket.notes.push({
        note,
        author: authorId,
        authorName,
        createdAt: new Date()
      });
      ticket.updatedAt = new Date();
      await ticket.save();
    }

    res.json({
      success: true,
      message: 'Internal note added to ticket.',
      ticket
    });
  } catch (error) {
    next(error);
  }
}

// 8. Platform Admin Settings
export async function getAdminSettings(req, res, next) {
  try {
    const mode = getDbMode();
    if (mode === 'in-memory-demo') {
      const value = await inMemoryStore.getAdminSettings('platform_config');
      return res.json({ success: true, mode, settings: value });
    }

    let setting = await AdminSetting.findOne({ key: 'platform_config' });
    if (!setting) {
      setting = await AdminSetting.create({
        key: 'platform_config',
        value: {
          allowCompanyRegistration: true,
          requireJobModeration: false,
          defaultCandidateReviewPeriodDays: 14,
          maintenanceMode: false
        },
        updatedBy: req.user._id || req.user.id
      });
    }

    res.json({ success: true, mode, settings: setting.value });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSettings(req, res, next) {
  try {
    if (req.user.adminRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only Platform Owners can update platform settings.' });
    }

    const { allowCompanyRegistration, requireJobModeration, defaultCandidateReviewPeriodDays, maintenanceMode } = req.body;
    const adminId = req.user._id || req.user.id;
    const updates = {};
    if (typeof allowCompanyRegistration === 'boolean') updates.allowCompanyRegistration = allowCompanyRegistration;
    if (typeof requireJobModeration === 'boolean') updates.requireJobModeration = requireJobModeration;
    if (Number.isInteger(Number(defaultCandidateReviewPeriodDays))) {
      updates.defaultCandidateReviewPeriodDays = Number(defaultCandidateReviewPeriodDays);
    }
    if (typeof maintenanceMode === 'boolean') updates.maintenanceMode = maintenanceMode;

    const mode = getDbMode();
    let newSettings = null;

    if (mode === 'in-memory-demo') {
      newSettings = await inMemoryStore.updateAdminSettings('platform_config', updates, adminId);
    } else {
      let setting = await AdminSetting.findOne({ key: 'platform_config' });
      if (!setting) {
        setting = new AdminSetting({ key: 'platform_config', value: updates, updatedBy: adminId });
      } else {
        setting.value = { ...setting.value, ...updates };
        setting.updatedBy = adminId;
      }
      await setting.save();
      newSettings = setting.value;
    }

    await recordAudit(req, {
      action: 'ADMIN_SETTINGS_UPDATE',
      targetType: 'SYSTEM',
      targetId: 'platform_config',
      outcome: 'SUCCESS',
      metadata: updates
    });

    res.json({
      success: true,
      message: 'Platform settings updated successfully.',
      settings: newSettings
    });
  } catch (error) {
    next(error);
  }
}

// 9. Reports & CSV Export with Formula Injection Protection
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Formula Injection Protection: neutralise formula starters =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function exportReportCsv(req, res, next) {
  try {
    const { type } = req.params; // users, companies, jobs, audit_logs
    const mode = getDbMode();
    let csvRows = [];
    let filename = `hirevoxa_report_${type}_${Date.now()}.csv`;

    if (type === 'users') {
      let users = [];
      if (mode === 'in-memory-demo') {
        const result = await inMemoryStore.findAdminUsers({ limit: 1000 });
        users = result.users;
      } else {
        users = await User.find().select('-password').limit(1000);
      }

      csvRows.push(['User ID', 'Name', 'Email', 'Role', 'Admin Role', 'Status', 'Company Name', 'Created At'].map(escapeCsvValue).join(','));
      for (const u of users) {
        csvRows.push([
          u._id || u.id,
          u.name,
          u.email,
          u.role,
          u.adminRole || 'None',
          u.status || 'active',
          u.companyName || '',
          u.createdAt ? new Date(u.createdAt).toISOString() : ''
        ].map(escapeCsvValue).join(','));
      }
    } else if (type === 'companies') {
      let companies = [];
      if (mode === 'in-memory-demo') {
        const result = await inMemoryStore.findAdminCompanies({ limit: 1000 });
        companies = result.companies;
      } else {
        companies = await Company.find().limit(1000);
      }

      csvRows.push(['Company ID', 'Name', 'Industry', 'Location', 'Verification Status', 'Verification Reason', 'Created At'].map(escapeCsvValue).join(','));
      for (const c of companies) {
        csvRows.push([
          c._id || c.id,
          c.name,
          c.industry || '',
          c.location || '',
          c.verificationStatus || 'pending',
          c.verificationReason || '',
          c.createdAt ? new Date(c.createdAt).toISOString() : ''
        ].map(escapeCsvValue).join(','));
      }
    } else if (type === 'jobs') {
      let jobs = [];
      if (mode === 'in-memory-demo') {
        const result = await inMemoryStore.findAdminJobs({ limit: 1000 });
        jobs = result.jobs;
      } else {
        jobs = await Job.find().limit(1000);
      }

      csvRows.push(['Job ID', 'Title', 'Company', 'Status', 'Moderation Status', 'Moderation Reason', 'Location', 'Created At'].map(escapeCsvValue).join(','));
      for (const j of jobs) {
        csvRows.push([
          j._id || j.id,
          j.title,
          j.company,
          j.status,
          j.moderationStatus || 'approved',
          j.moderationReason || '',
          j.location || '',
          j.createdAt ? new Date(j.createdAt).toISOString() : ''
        ].map(escapeCsvValue).join(','));
      }
    } else if (type === 'audit_logs') {
      let logs = [];
      if (mode === 'in-memory-demo') {
        const result = await inMemoryStore.findAuditLogs({ limit: 1000 });
        logs = result.logs;
      } else {
        logs = await AuditLog.find().limit(1000);
      }

      csvRows.push(['Log ID', 'Actor Email', 'Actor Role', 'Action', 'Target Type', 'Target ID', 'Outcome', 'IP Address', 'Created At'].map(escapeCsvValue).join(','));
      for (const l of logs) {
        csvRows.push([
          l._id || l.id,
          l.actorEmail,
          l.actorRole,
          l.action,
          l.targetType,
          l.targetId,
          l.outcome,
          l.ipAddress || '',
          l.createdAt ? new Date(l.createdAt).toISOString() : ''
        ].map(escapeCsvValue).join(','));
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report export type. Supported: users, companies, jobs, audit_logs' });
    }

    await recordAudit(req, {
      action: 'DATA_EXPORT_CSV',
      targetType: 'REPORT',
      targetId: type,
      outcome: 'SUCCESS',
      metadata: { rowCount: csvRows.length - 1 }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvRows.join('\r\n'));
  } catch (error) {
    next(error);
  }
}
