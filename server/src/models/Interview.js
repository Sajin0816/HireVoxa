import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true, index: true },
    candidateId: { type: String, required: true },
    jobId: { type: String, required: true },
    applicationId: { type: String, default: null },
    candidateName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    interviewType: { type: String, default: 'Technical Interview' },
    proposedDate: { type: Date, required: true },
    scheduledEndTime: { type: Date, default: null },
    timeZone: { type: String, default: 'EST' },
    meetingLink: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Pending'
    },
    notes: { type: String, trim: true },
    interviewerName: { type: String, default: 'Hiring Team' },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

interviewSchema.index({ companyId: 1, status: 1 });
interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ jobId: 1 });
interviewSchema.index({ applicationId: 1 });
interviewSchema.index({ status: 1 });

export const Interview = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
