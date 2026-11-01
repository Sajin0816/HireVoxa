import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    candidateUserId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    storageKey: { type: String, required: true, unique: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    version: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

resumeSchema.index({ candidateUserId: 1, isActive: 1 });

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
