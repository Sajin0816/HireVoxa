import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    timeZone: { type: String, required: true },
    skills: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number, required: true, min: 0 },
    englishProficiency: {
      type: String,
      enum: ['Conversational (B1)', 'Professional (B2)', 'Fluent (C1)', 'Fluent (C2)', 'Native', 'Not Assessed'],
      default: 'Professional (B2)'
    },
    availability: {
      type: String,
      enum: ['Immediate', '2 Weeks', '1 Month', 'More than 1 Month'],
      default: 'Immediate'
    },
    employmentPreference: {
      type: String,
      enum: ['Full-Time', 'Contract', 'Part-Time', 'Any'],
      default: 'Full-Time'
    },
    compensationExpectation: { type: String, trim: true },
    summary: { type: String, trim: true },
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
      default: 'Active'
    },
    consentStatus: {
      type: String,
      enum: ['Granted', 'Withdrawn', 'Pending'],
      default: 'Granted'
    },
    avatarUrl: { type: String, trim: true },
    rating: { type: Number, default: 5.0 },
    completedProjects: { type: Number, default: 0 },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

candidateSchema.index({ skills: 1 });
candidateSchema.index({ country: 1 });
candidateSchema.index({ yearsOfExperience: 1 });

export const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
