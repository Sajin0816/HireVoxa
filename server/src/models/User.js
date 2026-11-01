import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['company', 'candidate', 'admin'],
      default: 'company'
    },
    adminRole: {
      type: String,
      enum: ['owner', 'ops_admin', 'analyst', null],
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true
    },
    suspendedReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },
    companyName: { type: String, trim: true, default: '' },
    companyId: { type: String, trim: true, index: true },
    avatar: {
      type: String,
      default: ''
    },
    accountExecutive: {
      name: { type: String, default: '' },
      role: { type: String, default: '' },
      email: { type: String, default: '' },
      avatar: {
        type: String,
        default: ''
      }
    },
    joinedDate: { type: String, default: '' },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Password hash hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
