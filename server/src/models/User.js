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
    companyName: { type: String, trim: true, default: 'Acme Technologies' },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    accountExecutive: {
      name: { type: String, default: 'Esther Howard' },
      role: { type: String, default: 'Account Executive - AE' },
      email: { type: String, default: 'esther.howard@hirevoxa.internal' },
      avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
      }
    },
    joinedDate: { type: String, default: '27 April, 2024' },
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
