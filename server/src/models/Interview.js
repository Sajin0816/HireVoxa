import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true },
    jobId: { type: String, required: true },
    candidateName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    proposedDate: { type: Date, required: true },
    timeZone: { type: String, default: 'EST' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    notes: { type: String, trim: true },
    interviewerName: { type: String, default: 'Hiring Team' },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ jobId: 1 });
interviewSchema.index({ status: 1 });

export const Interview = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
