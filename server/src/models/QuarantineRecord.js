import mongoose from 'mongoose';

const quarantineSchema = new mongoose.Schema(
  {
    resourceType: { type: String, required: true, enum: ['user', 'company', 'candidate', 'job', 'application', 'interview', 'shortlist', 'message', 'resume'] },
    resourceId: { type: String, required: true },
    reason: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    quarantinedAt: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

quarantineSchema.index({ resourceType: 1, resourceId: 1 }, { unique: true });

export const QuarantineRecord = mongoose.models.QuarantineRecord || mongoose.model('QuarantineRecord', quarantineSchema);
