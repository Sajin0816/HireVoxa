// In-Memory Data Store for Hirevoxa Demo Mode
// Provides resilient fallback when MongoDB is not running locally.
import bcrypt from 'bcryptjs';
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
    companyName: 'Acme Technologies',
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
    companyName: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: '10 January, 2024',
    isDemoRecord: true,
    createdAt: new Date('2024-01-10')
  }
];

class InMemoryStore {
  constructor() {
    this.candidates = JSON.parse(JSON.stringify(seedCandidates));
    this.jobs = JSON.parse(JSON.stringify(seedJobs));
    this.interviews = JSON.parse(JSON.stringify(seedInterviews));
    this.users = JSON.parse(JSON.stringify(defaultUsers));
    this.shortlists = [
      { _id: 'sh-1', userId: 'usr-company-001', candidateId: 'cand-001', notes: 'Top match for Frontend lead role' },
      { _id: 'sh-2', userId: 'usr-company-001', candidateId: 'cand-002', notes: 'Argentina timezone, high performance React' }
    ];
    this.messages = [
      {
        _id: 'msg-1',
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
  }

  reset() {
    this.candidates = JSON.parse(JSON.stringify(seedCandidates));
    this.jobs = JSON.parse(JSON.stringify(seedJobs));
    this.interviews = JSON.parse(JSON.stringify(seedInterviews));
    this.users = JSON.parse(JSON.stringify(defaultUsers));
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
    const newUser = {
      _id: `usr-${Date.now().toString().slice(-4)}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'company',
      companyName: userData.companyName || 'My Startup Inc.',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      accountExecutive: {
        name: 'Esther Howard',
        role: 'Account Executive - AE',
        email: 'esther.howard@hirevoxa.internal',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
      },
      joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      isDemoRecord: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // Candidate methods
  async findCandidates(filter = {}) {
    let result = [...this.candidates];

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

  // Job methods
  async findJobs(filter = {}) {
    let result = [...this.jobs];

    if (filter.status) {
      result = result.filter(j => j.status.toLowerCase() === filter.status.toLowerCase());
    }

    if (filter.employmentType) {
      result = result.filter(j => j.employmentType.toLowerCase() === filter.employmentType.toLowerCase());
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
      _id: `job-${Date.now().toString().slice(-4)}`,
      ...jobData,
      status: jobData.status || 'Open',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDemoRecord: true
    };
    this.jobs.unshift(newJob);
    return newJob;
  }

  async updateJob(id, updates) {
    const index = this.jobs.findIndex(j => j._id === id);
    if (index === -1) return null;

    this.jobs[index] = {
      ...this.jobs[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.jobs[index];
  }

  async deleteJob(id) {
    const index = this.jobs.findIndex(j => j._id === id);
    if (index === -1) return false;
    this.jobs.splice(index, 1);
    return true;
  }

  // Interview methods
  async findInterviews() {
    return [...this.interviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async createInterview(interviewData) {
    const newInterview = {
      _id: `int-${Date.now().toString().slice(-4)}`,
      ...interviewData,
      status: interviewData.status || 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDemoRecord: true
    };
    this.interviews.unshift(newInterview);
    return newInterview;
  }

  async updateInterview(id, updates) {
    const index = this.interviews.findIndex(i => i._id === id);
    if (index === -1) return null;
    this.interviews[index] = {
      ...this.interviews[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.interviews[index];
  }

  // Shortlist methods
  async findShortlists(userId) {
    return this.shortlists.filter(s => s.userId === userId);
  }

  async toggleShortlist(userId, candidateId, jobId = null, notes = '') {
    const index = this.shortlists.findIndex(s => s.userId === userId && s.candidateId === candidateId);
    if (index !== -1) {
      this.shortlists.splice(index, 1);
      return { shortlisted: false };
    } else {
      const newItem = {
        _id: `sh-${Date.now().toString().slice(-4)}`,
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
  async findMessages(conversationId) {
    if (conversationId) {
      return this.messages.filter(m => m.conversationId === conversationId);
    }
    return [...this.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async createMessage(msgData) {
    const newMsg = {
      _id: `msg-${Date.now().toString().slice(-4)}`,
      ...msgData,
      read: false,
      createdAt: new Date()
    };
    this.messages.push(newMsg);
    return newMsg;
  }
}

export const inMemoryStore = new InMemoryStore();
