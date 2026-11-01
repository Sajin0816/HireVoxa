// In-Memory Data Store for Hirevoxa Demo Mode
// Provides resilient fallback when MongoDB is not running locally.
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { seedCandidates, seedJobs, seedInterviews } from '../seed/seedData.js';

// Pre-hashed password for "password123"
const defaultHashedPassword = bcrypt.hashSync('password123', 10);

export const defaultUsers = [
  {
    _id: 'usr-company-001',
    name: 'Richard Feynman',
    email: 'richardfeynman@gmail.com',
    password: defaultHashedPassword,
    role: 'company',
    status: 'active',
    adminRole: null,
    companyName: 'Acme Technologies',
    companyId: 'usr-company-001',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    accountExecutive: {
      name: 'Esther Howard',
      role: 'Account Executive - AE',
      email: 'esther.howard@hirevoxa.internal',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
    },
    joinedDate: '27 April, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-04-27')
  },
  {
    _id: 'usr-candidate-001',
    name: 'Rodrigo Feynman Silva',
    email: 'rodrigo@hirevoxa-latam.dev',
    password: defaultHashedPassword,
    role: 'candidate',
    status: 'active',
    adminRole: null,
    companyName: '',
    companyId: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: '10 January, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-01-10')
  },
  {
    _id: 'usr-admin-001',
    name: 'Platform Owner',
    email: 'owner@hirevoxa.internal',
    password: defaultHashedPassword,
    role: 'admin',
    adminRole: 'owner',
    status: 'active',
    companyName: 'Hirevoxa Ops',
    companyId: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: '01 January, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-01-01')
  },
  {
    _id: 'usr-admin-002',
    name: 'Operations Admin',
    email: 'ops@hirevoxa.internal',
    password: defaultHashedPassword,
    role: 'admin',
    adminRole: 'ops_admin',
    status: 'active',
    companyName: 'Hirevoxa Ops',
    companyId: '',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: '01 February, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-02-01')
  },
  {
    _id: 'usr-admin-003',
    name: 'Read-only Analyst',
    email: 'analyst@hirevoxa.internal',
    password: defaultHashedPassword,
    role: 'admin',
    adminRole: 'analyst',
    status: 'active',
    companyName: 'Hirevoxa Ops',
    companyId: '',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: '01 March, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-03-01')
  }
];

export const defaultCompanies = [
  {
    _id: 'usr-company-001',
    name: 'Acme Technologies',
    userId: 'usr-company-001',
    website: 'https://acme.tech',
    industry: 'SaaS & Enterprise',
    location: 'San Francisco, CA',
    description: 'Leading provider of high scale cloud development services.',
    plan: 'starter',
    billingEmail: 'billing@acme.tech',
    verificationStatus: 'verified',
    verificationReason: 'Verified corporate domain and registration proof',
    verifiedBy: 'usr-admin-001',
    verifiedAt: new Date('2024-04-28'),
    verificationHistory: [
      {
        status: 'verified',
        reason: 'Initial verification',
        actionBy: 'usr-admin-001',
        createdAt: new Date('2024-04-28')
      }
    ],
    createdAt: new Date('2024-04-27'),
    updatedAt: new Date('2024-04-28')
  },
  {
    _id: 'comp-002',
    name: 'NovaScale Inc',
    userId: 'usr-company-002',
    website: 'https://novascale.io',
    industry: 'FinTech',
    location: 'Austin, TX',
    description: 'Next gen cross-border payments for global teams.',
    plan: 'starter',
    billingEmail: 'billing@novascale.io',
    verificationStatus: 'pending',
    verificationReason: '',
    verifiedBy: null,
    verifiedAt: null,
    verificationHistory: [],
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-10')
  }
];

export const defaultAuditLogs = [
  {
    _id: 'audit-001',
    actorId: 'usr-admin-001',
    actorEmail: 'owner@hirevoxa.internal',
    actorRole: 'owner',
    action: 'ADMIN_BOOTSTRAP',
    targetType: 'SYSTEM',
    targetId: 'usr-admin-001',
    outcome: 'SUCCESS',
    metadata: { reason: 'System initial initialization' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2024-01-01T00:00:00Z')
  }
];

export const defaultSupportTickets = [
  {
    _id: 'ticket-001',
    ticketNumber: 'TICK-1001',
    subject: 'Interview scheduling timezone sync error',
    description: 'When booking with candidate in Argentina GMT-3, calendar showed GMT-5',
    category: 'interview',
    priority: 'high',
    status: 'open',
    assignedTo: 'usr-admin-002',
    createdBy: 'usr-company-001',
    userEmail: 'richardfeynman@gmail.com',
    userName: 'Richard Feynman',
    notes: [
      {
        _id: 'note-001',
        note: 'Investigating daylight savings offset in calendar service',
        author: 'usr-admin-002',
        authorName: 'Operations Admin',
        createdAt: new Date(Date.now() - 3600000 * 12)
      }
    ],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 3600000 * 12)
  }
];

export const defaultAdminSettings = [
  {
    _id: 'setting-platform-config',
    key: 'platform_config',
    value: {
      allowCompanyRegistration: true,
      requireJobModeration: false,
      defaultCandidateReviewPeriodDays: 14,
      maintenanceMode: false
    },
    updatedBy: 'usr-admin-001',
    updatedAt: new Date()
  }
];

export const defaultPlacementFees = [
  {
    _id: 'plf-001',
    placementId: 'PLF-2026-0001',
    companyId: 'usr-company-001',
    candidateUserId: 'usr-candidate-001',
    candidateId: 'cand-001',
    jobId: 'job-001',
    applicationId: 'app-seed-001',
    candidateName: 'Rodrigo Feynman Silva',
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Acme Technologies',
    feeAmountCents: 250000,
    currency: 'USD',
    status: 'paid',
    hiredAt: new Date('2026-08-15'),
    replacementGuaranteeExpiry: new Date('2026-11-13'),
    invoicedAt: new Date('2026-08-16'),
    paidAt: new Date('2026-08-20'),
    invoiceId: 'inv-001',
    paymentReference: 'PAY-REF-8831',
    termsVersion: 'HVX-TOS-2026-V1',
    auditTrail: [
      {
        action: 'PLACEMENT_HIRED',
        fromStatus: 'not_eligible',
        toStatus: 'eligible',
        changedBy: 'usr-company-001',
        changedAt: new Date('2026-08-15'),
        reason: 'Candidate hired for Senior Full Stack Engineer'
      },
      {
        action: 'INVOICE_GENERATED',
        fromStatus: 'eligible',
        toStatus: 'invoiced',
        changedBy: 'usr-admin-001',
        changedAt: new Date('2026-08-16'),
        reason: 'Invoice INV-2026-0001 generated'
      },
      {
        action: 'PAYMENT_RECORDED',
        fromStatus: 'invoiced',
        toStatus: 'paid',
        changedBy: 'usr-admin-001',
        changedAt: new Date('2026-08-20'),
        reason: 'Wire transfer confirmed'
      }
    ]
  }
];

export const defaultSubscriptions = [
  {
    _id: 'sub-001',
    companyId: 'usr-company-001',
    plan: 'starter',
    status: 'active',
    amountCents: 0,
    currency: 'USD',
    billingInterval: null,
    currentPeriodStart: new Date('2026-01-01'),
    currentPeriodEnd: new Date('2027-01-01'),
    cancelAtPeriodEnd: false,
    auditTrail: [
      {
        action: 'STARTER_PILOT_ENROLLED',
        fromStatus: null,
        toStatus: 'active',
        changedBy: 'SYSTEM',
        changedAt: new Date('2026-01-01'),
        notes: 'Enrolled in Employer Starter free pilot'
      }
    ]
  }
];

export const defaultInvoices = [
  {
    _id: 'inv-001',
    invoiceNumber: 'INV-2026-0001',
    companyId: 'usr-company-001',
    companyName: 'Acme Technologies',
    type: 'placement_fee',
    referenceId: 'plf-001',
    amountCents: 250000,
    currency: 'USD',
    status: 'paid',
    dueDate: new Date('2026-08-30'),
    paidAt: new Date('2026-08-20'),
    paymentMethod: 'manual_wire',
    paymentReference: 'PAY-REF-8831',
    lineItems: [
      {
        description: 'Qualifying Placement Fee — Rodrigo Feynman Silva (Senior Full Stack Engineer)',
        quantity: 1,
        unitAmountCents: 250000,
        totalAmountCents: 250000
      }
    ],
    billingAddress: {
      companyName: 'Acme Technologies',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States'
    },
    notes: 'Placement fee governed by 90-day replacement policy.'
  }
];

class InMemoryStore {
  constructor() {
    this.candidates = JSON.parse(JSON.stringify(seedCandidates));
    this.candidates[0].userId = 'usr-candidate-001';
    this.jobs = JSON.parse(JSON.stringify(seedJobs)).map(j => ({
      ...j,
      moderationStatus: j.moderationStatus || 'approved',
      moderationReason: j.moderationReason || 'Initial system seed',
      moderationHistory: j.moderationHistory || []
    }));
    this.interviews = JSON.parse(JSON.stringify(seedInterviews));
    this.users = JSON.parse(JSON.stringify(defaultUsers));
    this.companies = JSON.parse(JSON.stringify(defaultCompanies));
    this.auditLogs = JSON.parse(JSON.stringify(defaultAuditLogs));
    this.supportTickets = JSON.parse(JSON.stringify(defaultSupportTickets));
    this.adminSettings = JSON.parse(JSON.stringify(defaultAdminSettings));
    this.placementFees = JSON.parse(JSON.stringify(defaultPlacementFees));
    this.subscriptions = JSON.parse(JSON.stringify(defaultSubscriptions));
    this.invoices = JSON.parse(JSON.stringify(defaultInvoices));
    this.shortlists = [
      { _id: 'sh-1', companyId: 'usr-company-001', userId: 'usr-company-001', candidateId: 'cand-001', notes: 'Top match for Frontend lead role' },
      { _id: 'sh-2', companyId: 'usr-company-001', userId: 'usr-company-001', candidateId: 'cand-002', notes: 'Argentina timezone, high performance React' }
    ];
    this.messages = [
      {
        _id: 'msg-1',
        companyId: 'usr-company-001',
        conversationId: 'conv-cand-001',
        senderId: 'usr-company-001',
        senderName: 'Richard Feynman',
        senderRole: 'company',
        recipientId: 'cand-001',
        recipientName: 'Rodrigo Feynman Silva',
        content: 'Hi Rodrigo, we reviewed your React and Node background and would love to schedule a technical architecture discussion.',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        _id: 'msg-2',
        companyId: 'usr-company-001',
        conversationId: 'conv-cand-001',
        senderId: 'cand-001',
        senderName: 'Rodrigo Feynman Silva',
        senderRole: 'candidate',
        recipientId: 'usr-company-001',
        recipientName: 'Richard Feynman',
        content: 'Hello Richard! Thank you for reaching out. I am available anytime between 10am-5pm EST for a call.',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 2)
      }
    ];
    this.applications = [];
    this.resumes = [];
    this.resumeFiles = new Map();
    this.notifications = [];
  }

  reset() {
    this.candidates = JSON.parse(JSON.stringify(seedCandidates));
    this.candidates[0].userId = 'usr-candidate-001';
    this.jobs = JSON.parse(JSON.stringify(seedJobs)).map(j => ({
      ...j,
      moderationStatus: j.moderationStatus || 'approved',
      moderationReason: j.moderationReason || 'Initial system seed',
      moderationHistory: j.moderationHistory || []
    }));
    this.interviews = JSON.parse(JSON.stringify(seedInterviews));
    this.users = JSON.parse(JSON.stringify(defaultUsers));
    this.companies = JSON.parse(JSON.stringify(defaultCompanies));
    this.auditLogs = JSON.parse(JSON.stringify(defaultAuditLogs));
    this.supportTickets = JSON.parse(JSON.stringify(defaultSupportTickets));
    this.adminSettings = JSON.parse(JSON.stringify(defaultAdminSettings));
    this.placementFees = JSON.parse(JSON.stringify(defaultPlacementFees));
    this.subscriptions = JSON.parse(JSON.stringify(defaultSubscriptions));
    this.invoices = JSON.parse(JSON.stringify(defaultInvoices));
    this.shortlists = [
      { _id: 'sh-1', companyId: 'usr-company-001', userId: 'usr-company-001', candidateId: 'cand-001', notes: 'Top match for Frontend lead role' },
      { _id: 'sh-2', companyId: 'usr-company-001', userId: 'usr-company-001', candidateId: 'cand-002', notes: 'Argentina timezone, high performance React' }
    ];
    this.messages = [
      {
        _id: 'msg-1',
        companyId: 'usr-company-001',
        conversationId: 'conv-cand-001',
        senderId: 'usr-company-001',
        senderName: 'Richard Feynman',
        senderRole: 'company',
        recipientId: 'cand-001',
        recipientName: 'Rodrigo Feynman Silva',
        content: 'Hi Rodrigo, we reviewed your React and Node background and would love to schedule a technical architecture discussion.',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        _id: 'msg-2',
        companyId: 'usr-company-001',
        conversationId: 'conv-cand-001',
        senderId: 'cand-001',
        senderName: 'Rodrigo Feynman Silva',
        senderRole: 'candidate',
        recipientId: 'usr-company-001',
        recipientName: 'Richard Feynman',
        content: 'Hello Richard! Thank you for reaching out. I am available anytime between 10am-5pm EST for a call.',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 2)
      }
    ];
    this.applications = [];
    this.resumes = [];
    this.resumeFiles = new Map();
    this.notifications = [];
  }

  // User methods
  async findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id) {
    return this.users.find(u => u._id === id) || null;
  }

  async createUser(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const userId = `usr-${randomUUID()}`;
    const assignedCompanyId = userData.companyId || (userData.role === 'company' ? userId : '');

    const newUser = {
      _id: userId,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'company',
      companyName: userData.companyName || 'My Startup Inc.',
      companyId: assignedCompanyId,
       avatar: userData.avatar || '',
       accountExecutive: {
         name: '',
         role: '',
         email: '',
         avatar: ''
       },
       joinedDate: new Date().toISOString(),
       isDemoRecord: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // Candidate methods
  async findCandidates(filter = {}) {
    let result = [...this.candidates];

    if (filter.onlyPublic) result = result.filter(c => c.profileVisibility === 'Active');

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q)) ||
        c.country.toLowerCase().includes(q)
      );
    }

    if (filter.skill) {
      const skillLower = filter.skill.toLowerCase();
      result = result.filter(c => c.skills.some(s => s.toLowerCase() === skillLower));
    }

    if (filter.experience) {
      const exp = parseInt(filter.experience, 10);
      if (!isNaN(exp)) {
        result = result.filter(c => c.yearsOfExperience >= exp);
      }
    }

    if (filter.availability) {
      result = result.filter(c => c.availability.toLowerCase() === filter.availability.toLowerCase());
    }

    if (filter.employmentPreference) {
      result = result.filter(c => c.employmentPreference.toLowerCase() === filter.employmentPreference.toLowerCase());
    }

    if (filter.country) {
      result = result.filter(c => c.country.toLowerCase() === filter.country.toLowerCase());
    }

    return result;
  }

  async findCandidateById(id) {
    return this.candidates.find(c => c._id === id) || null;
  }

  async findCandidateByUserId(userId) {
    return this.candidates.find(c => c.userId === userId) || null;
  }

  async createCandidate(profile) {
    const existing = this.candidates.find(c => c.userId === profile.userId);
    if (existing) return existing;
    const candidate = {
      _id: profile._id || `cand-${randomUUID()}`,
      userId: profile.userId,
      name: profile.name,
      title: profile.title || '',
      currentResumeId: null,
      headline: profile.headline || '',
      country: profile.country || '',
      city: profile.city || '',
      location: profile.location || '',
      timeZone: profile.timeZone || '',
      skills: profile.skills || [],
      yearsOfExperience: profile.yearsOfExperience ?? null,
      seniority: profile.seniority || '',
      availability: profile.availability || '',
      employmentPreference: profile.employmentPreference || 'Any',
      compensationExpectation: profile.compensationExpectation || '',
      summary: profile.summary || '',
      portfolioUrl: profile.portfolioUrl || '',
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      desiredRole: profile.desiredRole || '',
      desiredEmploymentType: profile.desiredEmploymentType || '',
      desiredCompensation: profile.desiredCompensation || '',
      startDate: profile.startDate || '',
      workExperience: profile.workExperience || [],
      education: profile.education || [],
      verificationStatus: 'Under Review',
      profileVisibility: 'Private',
      consentStatus: 'Granted',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.candidates.push(candidate);
    return candidate;
  }

  async updateCandidate(id, updates) {
    const index = this.candidates.findIndex(c => c._id === id);
    if (index === -1) return null;
    this.candidates[index] = { ...this.candidates[index], ...updates, updatedAt: new Date() };
    return this.candidates[index];
  }

  // Job methods
  async findJobs(filter = {}) {
    let result = [...this.jobs];

    if (filter.companyId) {
      result = result.filter(j => j.companyId === filter.companyId);
    }

    if (filter.onlyPublicOpen) {
      result = result.filter(j => j.status === 'Open');
    }

    if (filter.status) {
      result = result.filter(j => j.status.toLowerCase() === filter.status.toLowerCase());
    }

    if (filter.employmentType) {
      result = result.filter(j => j.employmentType.toLowerCase() === filter.employmentType.toLowerCase());
    }

    if (filter.skill) {
      const skill = filter.skill.toLowerCase();
      result = result.filter(j => (j.requiredSkills || []).some(s => s.toLowerCase() === skill));
    }
    if (filter.seniority) result = result.filter(j => (j.seniority || '').toLowerCase() === filter.seniority.toLowerCase());
    if (filter.timezone) result = result.filter(j => (j.timezone || j.timeZoneOverlapRequirements || '').toLowerCase().includes(filter.timezone.toLowerCase()));
    if (filter.location) result = result.filter(j => (j.locationRequirement || '').toLowerCase().includes(filter.location.toLowerCase()));
    if (filter.minExperience !== undefined && filter.minExperience !== '') {
      const minExperience = Number(filter.minExperience);
      if (Number.isFinite(minExperience)) result = result.filter(j => Number(j.minimumExperience) >= minExperience);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findJobById(id) {
    return this.jobs.find(j => j._id === id) || null;
  }

  async createJob(jobData) {
    const newJob = {
      _id: `job-${randomUUID()}`,
      ...jobData,
      companyId: jobData.companyId || 'usr-company-001',
      postedBy: jobData.postedBy || 'usr-company-001',
      status: jobData.status || 'Open',
      createdAt: new Date(),
      updatedAt: new Date(),
       isDemoRecord: false
    };
    this.jobs.unshift(newJob);
    return newJob;
  }

  async updateJob(id, updates, companyId = null) {
    const index = this.jobs.findIndex(j => j._id === id);
    if (index === -1) return null;

    if (companyId && this.jobs[index].companyId !== companyId) {
      return null;
    }

    // Strip protected fields
    const { _id, companyId: _c, postedBy: _p, ...safeUpdates } = updates;

    this.jobs[index] = {
      ...this.jobs[index],
      ...safeUpdates,
      updatedAt: new Date()
    };
    return this.jobs[index];
  }

  async deleteJob(id, companyId = null) {
    const index = this.jobs.findIndex(j => j._id === id);
    if (index === -1) return false;

    if (companyId && this.jobs[index].companyId !== companyId) {
      return false;
    }

    this.jobs.splice(index, 1);
    return true;
  }

  // Interview methods
  async findInterviews(filter = {}) {
    let result = [...this.interviews];

    if (filter.companyId) {
      result = result.filter(i => i.companyId === filter.companyId);
    }

    if (filter.candidateId) {
      result = result.filter(i => i.candidateId === filter.candidateId);
    }

    if (filter.applicationId) {
      result = result.filter(i => i.applicationId === filter.applicationId);
    }

    if (filter.jobId) {
      result = result.filter(i => i.jobId === filter.jobId);
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findInterviewById(id) {
    return this.interviews.find(i => i._id === id) || null;
  }

  async createInterview(interviewData) {
    const newInterview = {
      _id: `int-${Date.now().toString().slice(-4)}`,
      ...interviewData,
      companyId: interviewData.companyId || 'usr-company-001',
      createdBy: interviewData.createdBy || 'usr-company-001',
      applicationId: interviewData.applicationId || null,
      interviewType: interviewData.interviewType || 'Technical Interview',
      scheduledEndTime: interviewData.scheduledEndTime || null,
      meetingLink: interviewData.meetingLink || '',
      status: interviewData.status || 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDemoRecord: false
    };
    this.interviews.unshift(newInterview);
    return newInterview;
  }

  async updateInterview(id, updates, companyId = null) {
    const index = this.interviews.findIndex(i => i._id === id);
    if (index === -1) return null;

    if (companyId && this.interviews[index].companyId !== companyId) {
      return null;
    }

    const { _id, companyId: _c, createdBy: _cb, ...safeUpdates } = updates;

    this.interviews[index] = {
      ...this.interviews[index],
      ...safeUpdates,
      updatedAt: new Date()
    };
    return this.interviews[index];
  }

  async deleteInterview(id, companyId = null) {
    const index = this.interviews.findIndex(i => i._id === id);
    if (index === -1) return false;

    if (companyId && this.interviews[index].companyId !== companyId) {
      return false;
    }

    this.interviews.splice(index, 1);
    return true;
  }

  // Shortlist methods
  async findShortlists(userId, companyId = null) {
    return this.shortlists.filter(s => s.userId === userId || (companyId && s.companyId === companyId));
  }

  async toggleShortlist(userId, candidateId, jobId = null, notes = '', companyId = null) {
    const effectiveCompanyId = companyId || userId;
    const index = this.shortlists.findIndex(
      s => (s.userId === userId || (companyId && s.companyId === companyId)) && s.candidateId === candidateId
    );
    if (index !== -1) {
      this.shortlists.splice(index, 1);
      return { shortlisted: false };
    } else {
      const newItem = {
        _id: `sh-${Date.now().toString().slice(-4)}`,
        companyId: effectiveCompanyId,
        userId,
        candidateId,
        jobId,
        notes,
        createdAt: new Date()
      };
      this.shortlists.push(newItem);
      return { shortlisted: true, item: newItem };
    }
  }

  // Message methods
  async findMessages(conversationId = null, userId = null) {
    let result = [...this.messages];

    if (conversationId) {
      result = result.filter(m => m.conversationId === conversationId);
    }

    if (userId) {
      result = result.filter(m => m.senderId === userId || m.recipientId === userId || m.companyId === userId);
    }

    return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async createMessage(msgData) {
    const newMsg = {
      _id: `msg-${Date.now().toString().slice(-4)}`,
      ...msgData,
      companyId: msgData.companyId || (msgData.senderRole === 'company' ? msgData.senderId : undefined),
      read: false,
      createdAt: new Date()
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // Candidate applications and private resume metadata
  async findApplicationByCandidateAndJob(candidateUserId, jobId) {
    return this.applications.find(a => a.candidateUserId === candidateUserId && a.jobId === jobId) || null;
  }

  async findApplications(filter = {}) {
    let result = [...this.applications];
    if (filter.candidateUserId) result = result.filter(a => a.candidateUserId === filter.candidateUserId);
    if (filter.companyId) result = result.filter(a => a.companyId === filter.companyId);
    if (filter.jobId) result = result.filter(a => a.jobId === filter.jobId);
    if (filter.jobIds) result = result.filter(a => filter.jobIds.includes(a.jobId));
    if (filter.status && filter.status !== 'All') result = result.filter(a => a.status === filter.status);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(a =>
        (a.jobSnapshot?.title && a.jobSnapshot.title.toLowerCase().includes(q)) ||
        (a.coverNote && a.coverNote.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  async findApplicationById(id) {
    return this.applications.find(a => a._id === id) || null;
  }

  async createApplication(data) {
    if (this.applications.some(a => a.candidateUserId === data.candidateUserId && a.jobId === data.jobId)) {
      throw Object.assign(new Error('Duplicate application'), { code: 11000 });
    }
    const application = {
      _id: `app-${randomUUID()}`,
      ...data,
      status: data.status || 'Submitted',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [{
        fromStatus: null,
        toStatus: 'Submitted',
        changedAt: new Date(),
        changedBy: data.candidateUserId,
        changedByRole: 'candidate',
        reason: 'Initial submission'
      }]
    };
    this.applications.push(application);
    return application;
  }

  async updateApplication(id, updates) {
    const index = this.applications.findIndex(a => a._id === id);
    if (index === -1) return null;
    this.applications[index] = { ...this.applications[index], ...updates, updatedAt: new Date() };
    return this.applications[index];
  }

  // Notification methods
  async createNotification(notifData) {
    const notif = {
      _id: `notif-${randomUUID()}`,
      ...notifData,
      read: false,
      createdAt: notifData.createdAt || new Date()
    };
    this.notifications.unshift(notif);
    return notif;
  }

  async findNotifications(filter = {}) {
    let result = [...this.notifications];
    if (filter.recipientUserId) {
      result = result.filter(n => n.recipientUserId === filter.recipientUserId || (filter.companyId && n.companyId === filter.companyId));
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async markNotificationRead(id, userId) {
    const notif = this.notifications.find(n => n._id === id);
    if (!notif) return null;
    if (notif.recipientUserId !== userId && notif.companyId !== userId) return null;
    notif.read = true;
    return notif;
  }

  async markAllNotificationsRead(userId, companyId = null) {
    for (const notif of this.notifications) {
      if (notif.recipientUserId === userId || (companyId && notif.companyId === companyId)) {
        notif.read = true;
      }
    }
    return true;
  }

  async findResumeById(id) {
    return this.resumes.find(r => r._id === id) || null;
  }

  async findActiveResumeByCandidate(candidateUserId) {
    return this.resumes.find(r => r.candidateUserId === candidateUserId && r.isActive) || null;
  }

  async createResume(metadata, buffer) {
    const resume = { _id: `resume-${randomUUID()}`, ...metadata, createdAt: new Date(), updatedAt: new Date() };
    this.resumes.push(resume);
    this.resumeFiles.set(resume._id, buffer);
    return resume;
  }

  async deactivateResume(id) {
    const resume = await this.findResumeById(id);
    if (resume) {
      resume.isActive = false;
      resume.updatedAt = new Date();
    }
    return resume;
  }

  async deleteResume(id) {
    const resume = await this.findResumeById(id);
    if (!resume) return null;
    resume.isActive = false;
    resume.deletedAt = new Date();
    resume.updatedAt = new Date();
    const buffer = this.resumeFiles.get(id);
    this.resumeFiles.delete(id);
    return { resume, buffer };
  }

  // Admin Methods
  async findAdminUsers(filter = {}) {
    let list = [...this.users];
    if (filter.role) {
      list = list.filter(u => u.role === filter.role);
    }
    if (filter.adminRole) {
      list = list.filter(u => u.adminRole === filter.adminRole);
    }
    if (filter.status) {
      list = list.filter(u => (u.status || 'active') === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.companyName && u.companyName.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit).map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    return {
      users: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async updateUserStatus(userId, { status, suspendedReason }) {
    const user = this.users.find(u => u._id === userId);
    if (!user) return null;
    user.status = status;
    user.suspendedReason = suspendedReason || '';
    user.suspendedAt = status === 'suspended' ? new Date() : null;
    user.updatedAt = new Date();
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateUserAdminRole(userId, { role, adminRole }) {
    const user = this.users.find(u => u._id === userId);
    if (!user) return null;
    user.role = role || user.role;
    user.adminRole = adminRole !== undefined ? adminRole : user.adminRole;
    user.updatedAt = new Date();
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAdminCompanies(filter = {}) {
    let list = [...this.companies];
    if (filter.verificationStatus) {
      list = list.filter(c => c.verificationStatus === filter.verificationStatus);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    return {
      companies: list.slice(startIndex, startIndex + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findCompanyById(id) {
    return this.companies.find(c => c._id === id || c.userId === id) || null;
  }

  async updateCompanyVerification(companyId, { verificationStatus, verificationReason, adminId }) {
    let company = this.companies.find(c => c._id === companyId || c.userId === companyId);
    if (!company) {
      // Create if referenced from user
      const user = this.users.find(u => u._id === companyId || u.companyId === companyId);
      if (user) {
        company = {
          _id: companyId,
          name: user.companyName || 'Registered Company',
          userId: user._id,
          website: '',
          industry: 'General',
          location: 'Remote',
          verificationStatus: 'pending',
          verificationReason: '',
          verificationHistory: [],
          createdAt: user.createdAt || new Date()
        };
        this.companies.push(company);
      } else {
        return null;
      }
    }
    company.verificationStatus = verificationStatus;
    company.verificationReason = verificationReason || '';
    company.verifiedBy = adminId;
    company.verifiedAt = new Date();
    company.updatedAt = new Date();
    if (!company.verificationHistory) company.verificationHistory = [];
    company.verificationHistory.push({
      status: verificationStatus,
      reason: verificationReason,
      actionBy: adminId,
      createdAt: new Date()
    });
    return company;
  }

  async findAdminJobs(filter = {}) {
    let list = [...this.jobs];
    if (filter.moderationStatus) {
      list = list.filter(j => (j.moderationStatus || 'approved') === filter.moderationStatus);
    }
    if (filter.status) {
      list = list.filter(j => j.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.company && j.company.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    return {
      jobs: list.slice(startIndex, startIndex + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findAdminJobById(id) {
    return this.jobs.find(j => j._id === id || j.id === id) || null;
  }

  async moderateJob(jobId, { moderationStatus, moderationReason, adminId }) {
    const job = this.jobs.find(j => j._id === jobId || j.id === jobId);
    if (!job) return null;
    job.moderationStatus = moderationStatus;
    job.moderationReason = moderationReason || '';
    job.moderatedBy = adminId;
    job.moderatedAt = new Date();
    if (!job.moderationHistory) job.moderationHistory = [];
    job.moderationHistory.push({
      status: moderationStatus,
      reason: moderationReason,
      actionBy: adminId,
      createdAt: new Date()
    });
    return job;
  }

  async findAdminApplications(filter = {}) {
    let list = [...this.applications];
    if (filter.status) {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter.jobId) {
      list = list.filter(a => a.jobId === filter.jobId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(a =>
        (a.candidateName && a.candidateName.toLowerCase().includes(q)) ||
        (a.jobTitle && a.jobTitle.toLowerCase().includes(q)) ||
        (a.candidateEmail && a.candidateEmail.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    return {
      applications: list.slice(startIndex, startIndex + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async createAuditLog(logData) {
    const log = {
      _id: `audit-${randomUUID()}`,
      actorId: logData.actorId,
      actorEmail: logData.actorEmail,
      actorRole: logData.actorRole,
      action: logData.action,
      targetType: logData.targetType,
      targetId: logData.targetId,
      outcome: logData.outcome || 'SUCCESS',
      metadata: logData.metadata || {},
      ipAddress: logData.ipAddress || '127.0.0.1',
      userAgent: logData.userAgent || '',
      createdAt: new Date()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  async findAuditLogs(filter = {}) {
    let list = [...this.auditLogs];
    if (filter.action) {
      list = list.filter(l => l.action === filter.action);
    }
    if (filter.actorId) {
      list = list.filter(l => l.actorId === filter.actorId);
    }
    if (filter.targetType) {
      list = list.filter(l => l.targetType === filter.targetType);
    }
    if (filter.targetId) {
      list = list.filter(l => l.targetId === filter.targetId);
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    return {
      logs: list.slice(startIndex, startIndex + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async createSupportTicket(ticketData) {
    const ticket = {
      _id: `ticket-${randomUUID()}`,
      ticketNumber: `TICK-${1000 + this.supportTickets.length + 1}`,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || 'general',
      priority: ticketData.priority || 'medium',
      status: ticketData.status || 'open',
      assignedTo: ticketData.assignedTo || null,
      createdBy: ticketData.createdBy,
      userEmail: ticketData.userEmail || '',
      userName: ticketData.userName || '',
      notes: ticketData.notes || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.supportTickets.unshift(ticket);
    return ticket;
  }

  async findSupportTickets(filter = {}) {
    let list = [...this.supportTickets];
    if (filter.status) {
      list = list.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
      list = list.filter(t => t.priority === filter.priority);
    }
    if (filter.category) {
      list = list.filter(t => t.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(t =>
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    return {
      tickets: list.slice(startIndex, startIndex + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findSupportTicketById(id) {
    return this.supportTickets.find(t => t._id === id || t.ticketNumber === id) || null;
  }

  async updateSupportTicket(id, updates) {
    const ticket = await this.findSupportTicketById(id);
    if (!ticket) return null;
    if (updates.status) ticket.status = updates.status;
    if (updates.priority) ticket.priority = updates.priority;
    if (updates.assignedTo !== undefined) ticket.assignedTo = updates.assignedTo;
    ticket.updatedAt = new Date();
    return ticket;
  }

  async addSupportTicketNote(id, { note, author, authorName }) {
    const ticket = await this.findSupportTicketById(id);
    if (!ticket) return null;
    if (!ticket.notes) ticket.notes = [];
    const newNote = {
      _id: `note-${randomUUID()}`,
      note,
      author,
      authorName: authorName || 'Staff Member',
      createdAt: new Date()
    };
    ticket.notes.push(newNote);
    ticket.updatedAt = new Date();
    return ticket;
  }

  async getAdminSettings(key = 'platform_config') {
    const setting = this.adminSettings.find(s => s.key === key);
    return setting ? setting.value : null;
  }

  async updateAdminSettings(key = 'platform_config', value, adminId) {
    let setting = this.adminSettings.find(s => s.key === key);
    if (setting) {
      setting.value = { ...setting.value, ...value };
      setting.updatedBy = adminId;
      setting.updatedAt = new Date();
    } else {
      setting = {
        _id: `setting-${randomUUID()}`,
        key,
        value,
        updatedBy: adminId,
        updatedAt: new Date()
      };
      this.adminSettings.push(setting);
    }
    return setting.value;
  }

  // Placement Fee methods
  async findPlacementFees(filter = {}) {
    return this.placementFees.filter(p => {
      if (filter.companyId && p.companyId !== filter.companyId) return false;
      if (filter.status && p.status !== filter.status) return false;
      if (filter.applicationId && p.applicationId !== filter.applicationId) return false;
      return true;
    });
  }

  async findPlacementFeeById(id) {
    return this.placementFees.find(p => p._id === id || p.placementId === id) || null;
  }

  async findPlacementFeeByApplicationId(applicationId) {
    return this.placementFees.find(p => p.applicationId === applicationId) || null;
  }

  async createPlacementFee(data) {
    const fee = {
      _id: `plf-${randomUUID()}`,
      placementId: `PLF-${new Date().getFullYear()}-${String(this.placementFees.length + 1).padStart(4, '0')}`,
      feeAmountCents: 250000,
      currency: 'USD',
      status: 'eligible',
      hiredAt: new Date(),
      replacementGuaranteeExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      auditTrail: [],
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.placementFees.push(fee);
    return fee;
  }

  async updatePlacementFee(id, updates) {
    const index = this.placementFees.findIndex(p => p._id === id || p.placementId === id);
    if (index === -1) return null;
    this.placementFees[index] = {
      ...this.placementFees[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.placementFees[index];
  }

  // Subscription methods
  async findSubscriptions(filter = {}) {
    return this.subscriptions.filter(s => {
      if (filter.companyId && s.companyId !== filter.companyId) return false;
      if (filter.status && s.status !== filter.status) return false;
      if (filter.plan && s.plan !== filter.plan) return false;
      return true;
    });
  }

  async findSubscriptionByCompanyId(companyId) {
    return this.subscriptions.find(s => s.companyId === companyId) || null;
  }

  async createSubscription(data) {
    const sub = {
      _id: `sub-${randomUUID()}`,
      amountCents: data.plan === 'pro' ? 19900 : 0,
      currency: 'USD',
      billingInterval: data.plan === 'pro' ? 'month' : null,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      auditTrail: [],
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subscriptions.push(sub);
    return sub;
  }

  async updateSubscription(id, updates) {
    const index = this.subscriptions.findIndex(s => s._id === id || s.companyId === id);
    if (index === -1) return null;
    this.subscriptions[index] = {
      ...this.subscriptions[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.subscriptions[index];
  }

  // Invoice methods
  async findInvoices(filter = {}) {
    return this.invoices.filter(i => {
      if (filter.companyId && i.companyId !== filter.companyId) return false;
      if (filter.status && i.status !== filter.status) return false;
      if (filter.type && i.type !== filter.type) return false;
      return true;
    });
  }

  async findInvoiceById(id) {
    return this.invoices.find(i => i._id === id || i.invoiceNumber === id) || null;
  }

  async createInvoice(data) {
    const inv = {
      _id: `inv-${randomUUID()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(this.invoices.length + 1).padStart(4, '0')}`,
      status: 'open',
      currency: 'USD',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lineItems: [],
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoices.push(inv);
    return inv;
  }

  async updateInvoice(id, updates) {
    const index = this.invoices.findIndex(i => i._id === id || i.invoiceNumber === id);
    if (index === -1) return null;
    this.invoices[index] = {
      ...this.invoices[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.invoices[index];
  }

  // Update company plan and entitlements
  async updateCompanyPlan(companyId, plan, subscriptionId = null) {
    const comp = this.companies.find(c => c._id === companyId || c.userId === companyId);
    if (comp) {
      comp.plan = plan;
      if (subscriptionId) comp.subscriptionId = subscriptionId;
      comp.updatedAt = new Date();
    }
    const user = this.users.find(u => u._id === companyId || u.companyId === companyId);
    if (user) {
      user.plan = plan;
    }
    return comp || null;
  }

  async getAdminSummary() {
    const activeUsers = this.users.filter(u => (u.status || 'active') === 'active');
    const suspendedUsers = this.users.filter(u => u.status === 'suspended');
    const candidates = this.users.filter(u => u.role === 'candidate');
    const companies = this.users.filter(u => u.role === 'company');
    const admins = this.users.filter(u => u.role === 'admin');

    const verifiedCompanies = this.companies.filter(c => c.verificationStatus === 'verified');
    const pendingCompanies = this.companies.filter(c => c.verificationStatus === 'pending');

    const publishedJobs = this.jobs.filter(j => j.status === 'published' || j.status === 'open');
    const pendingModerationJobs = this.jobs.filter(j => j.moderationStatus === 'pending');
    const flaggedJobs = this.jobs.filter(j => j.moderationStatus === 'flagged');

    const pendingApplications = this.applications.filter(a => a.status === 'submitted' || a.status === 'under_review');
    const openTickets = this.supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress');

    return {
      users: {
        total: this.users.length,
        active: activeUsers.length,
        suspended: suspendedUsers.length,
        candidates: candidates.length,
        companies: companies.length,
        admins: admins.length
      },
      companies: {
        total: this.companies.length,
        verified: verifiedCompanies.length,
        pending: pendingCompanies.length
      },
      jobs: {
        total: this.jobs.length,
        published: publishedJobs.length,
        pendingModeration: pendingModerationJobs.length,
        flagged: flaggedJobs.length
      },
      applications: {
        total: this.applications.length,
        pendingReview: pendingApplications.length
      },
      interviews: {
        total: this.interviews.length
      },
      supportTickets: {
        total: this.supportTickets.length,
        open: openTickets.length
      },
      auditLogs: {
        total: this.auditLogs.length,
        recent: this.auditLogs.slice(0, 5)
      },
      monetization: {
        totalPlacements: this.placementFees.length,
        eligiblePlacements: this.placementFees.filter(p => p.status === 'eligible').length,
        invoicedPlacements: this.placementFees.filter(p => p.status === 'invoiced').length,
        paidPlacements: this.placementFees.filter(p => p.status === 'paid').length,
        waivedPlacements: this.placementFees.filter(p => p.status === 'waived').length,
        disputedPlacements: this.placementFees.filter(p => p.status === 'disputed').length,
        invoicedRevenueCents: this.invoices.filter(i => i.status === 'open' || i.status === 'paid').reduce((sum, i) => sum + (i.amountCents || 0), 0),
        collectedRevenueCents: this.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amountCents || 0), 0),
        activeProSubscriptions: this.subscriptions.filter(s => s.status === 'active' && s.plan === 'pro').length,
        activeStarterPilots: this.subscriptions.filter(s => s.status === 'active' && s.plan === 'starter').length,
        estimatedMrrCents: this.subscriptions.filter(s => s.status === 'active' && s.plan === 'pro').length * 19900
      }
    };
  }
}

export const inMemoryStore = new InMemoryStore();
