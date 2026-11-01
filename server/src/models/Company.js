import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tenantKey: { type: String, trim: true, unique: true, sparse: true },
    ownerId: { type: String, required: true, index: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    authorizedMembers: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'correction_requested'],
      default: 'pending',
      index: true
    },
    verificationReason: { type: String, default: '' },
    verifiedBy: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verificationHistory: [
      {
        status: { type: String, required: true },
        reason: { type: String, default: '' },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    plan: {
      type: String,
      enum: ['starter', 'pro'],
      default: 'starter',
      index: true
    },
    subscriptionId: { type: String, default: null },
    billingEmail: { type: String, trim: true, default: '' },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

companySchema.index({ name: 1 });

export const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
