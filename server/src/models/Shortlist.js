import mongoose from 'mongoose';

const shortlistSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true },
    jobId: { type: String },
    notes: { type: String, trim: true },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

shortlistSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });
shortlistSchema.index({ userId: 1, candidateId: 1 });

export const Shortlist = mongoose.models.Shortlist || mongoose.model('Shortlist', shortlistSchema);
