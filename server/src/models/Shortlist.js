import mongoose from 'mongoose';

const shortlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    candidateId: { type: String, required: true },
    jobId: { type: String },
    notes: { type: String, trim: true },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

shortlistSchema.index({ userId: 1, candidateId: 1 }, { unique: true });

export const Shortlist = mongoose.models.Shortlist || mongoose.model('Shortlist', shortlistSchema);
