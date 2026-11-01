import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    userId: { type: String, index: { unique: true, sparse: true } },
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: '' },
    currentResumeId: { type: String, default: null },
    headline: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    timeZone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number, min: 0, max: 70, default: null },
    englishProficiency: {
      type: String,
      enum: ['Conversational (B1)', 'Professional (B2)', 'Fluent (C1)', 'Fluent (C2)', 'Native', 'Not Assessed'],
      default: 'Not Assessed'
    },
    availability: {
      type: String,
      enum: ['', 'Immediate', '2 Weeks', '1 Month', 'More than 1 Month'],
      default: ''
    },
    employmentPreference: {
      type: String,
      enum: ['Full-Time', 'Contract', 'Part-Time', 'Any'],
      default: 'Any'
    },
    compensationExpectation: { type: String, trim: true },
    summary: { type: String, trim: true },
    seniority: { type: String, trim: true },
    location: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    desiredRole: { type: String, trim: true },
    desiredEmploymentType: { type: String, trim: true },
    desiredCompensation: { type: String, trim: true },
    startDate: { type: String, trim: true },
    workExperience: [{
      company: { type: String, trim: true },
      role: { type: String, trim: true },
      startDate: { type: String, trim: true },
      endDate: { type: String, trim: true },
      description: { type: String, trim: true }
    }],
    education: [{
      institution: { type: String, trim: true },
      degree: { type: String, trim: true },
      field: { type: String, trim: true },
      graduationYear: { type: String, trim: true }
    }],
    portfolioUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'Under Review', 'Pending Verification'],
      default: 'Under Review'
    },
    profileVisibility: {
      type: String,
      enum: ['Active', 'Archived', 'Private'],
      default: 'Private'
    },
    consentStatus: {
      type: String,
      enum: ['Granted', 'Withdrawn', 'Pending'],
      default: 'Granted'
    },
    avatarUrl: { type: String, trim: true },
    rating: { type: Number },
    completedProjects: { type: Number, default: 0 },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

candidateSchema.index({ skills: 1 });
candidateSchema.index({ country: 1 });
candidateSchema.index({ yearsOfExperience: 1 });

export const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
