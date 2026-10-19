import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    authorizedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
