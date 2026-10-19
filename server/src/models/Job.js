import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: 'Engineering' },
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
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

jobSchema.index({ status: 1 });
jobSchema.index({ requiredSkills: 1 });

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
