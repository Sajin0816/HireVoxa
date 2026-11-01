import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidateUserId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    resumeId: { type: String, default: null },
    jobSnapshot: { title: String, employmentType: String, minimumExperience: Number },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'],
      default: 'Submitted'
    },
    coverNote: { type: String, trim: true, maxlength: 4000 },
    internalNotes: { type: String, trim: true, maxlength: 5000, default: '' },
    withdrawalReason: { type: String, trim: true, default: '' },
    withdrawnAt: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
    statusHistory: [{
      fromStatus: { type: String },
      toStatus: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, required: true },
      changedByRole: { type: String, default: 'company' },
      reason: { type: String, default: '' },
      internalNotes: { type: String, default: '' }
    }]
  },
  { timestamps: true }
);

applicationSchema.index({ candidateUserId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ companyId: 1, jobId: 1, status: 1 });

export const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
