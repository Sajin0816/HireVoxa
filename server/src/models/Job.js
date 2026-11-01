import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    postedBy: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: 'Engineering' },
    seniority: { type: String, trim: true },
    workArrangement: { type: String, trim: true, default: 'Remote' },
    timezone: { type: String, trim: true },
    requiredSkills: [{ type: String, trim: true }],
    minimumExperience: { type: Number, required: true, min: 0 },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Contract', 'Part-Time'],
      default: 'Full-Time'
    },
    budgetRange: { type: String, required: true, trim: true },
    timeZoneOverlapRequirements: { type: String, required: true, trim: true },
    locationRequirement: { type: String, default: 'Remote (Latin America)' },
    status: {
      type: String,
      enum: ['Draft', 'Open', 'On Hold', 'Fulfilled'],
      default: 'Open'
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'suspended'],
      default: 'approved',
      index: true
    },
    moderationReason: { type: String, default: '' },
    moderatedBy: { type: String, default: '' },
    moderatedAt: { type: Date, default: null },
    moderationHistory: [
      {
        status: { type: String, required: true },
        reason: { type: String, default: '' },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ requiredSkills: 1 });

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
