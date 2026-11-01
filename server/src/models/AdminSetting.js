import mongoose from 'mongoose';

const adminSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    requireJobModeration: { type: Boolean, default: false },
    allowCompanySelfRegistration: { type: Boolean, default: true },
    platformNotice: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    autoVerifyCompanies: { type: Boolean, default: false },
    updatedBy: { type: String, default: '' },
    updatedByEmail: { type: String, default: '' }
  },
  { timestamps: true }
);

export const AdminSetting = mongoose.models.AdminSetting || mongoose.model('AdminSetting', adminSettingSchema);
