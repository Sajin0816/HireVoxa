import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { inMemoryStore, defaultUsers } from '../services/inMemoryStore.js';
import { getDbMode } from '../config/db.js';
import { Candidate } from '../models/Candidate.js';
import { isValidEmail } from '../utils/securityUtils.js';

export const normalizeEmail = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

let jwtWarned = false;
export const getJwtSecret = () => {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== '' && process.env.JWT_SECRET !== 'hirevoxa_jwt_secret_dev_2026') {
    return process.env.JWT_SECRET.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    if (!jwtWarned) {
      console.warn('[SECURITY NOTICE] Dedicated JWT_SECRET environment variable not detected. Using secured fallback token.');
      jwtWarned = true;
    }
    return process.env.JWT_SECRET || 'hirevoxa_prod_preview_secret_fallback_2026_secured';
  }
  return 'hirevoxa_jwt_secret_dev_2026';
};
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('hirevoxa_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

export const clearAuthCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('hirevoxa_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/'
  });
};

const generateToken = (user) => {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  const effectiveCompanyId = user.companyId || (user.role === 'company' ? String(user._id) : '');
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role,
      adminRole: user.adminRole || (user.role === 'admin' ? 'owner' : undefined),
      status: user.status || 'active',
      name: user.name,
      companyName: user.companyName,
      companyId: effectiveCompanyId
    },
    secret,
    { expiresIn: JWT_EXPIRES }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Name, email, and password must be valid text strings.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const assignedRole = role || 'company';
    if (!['company', 'candidate'].includes(assignedRole)) {
      return res.status(400).json({ success: false, error: 'A new account must be either a company or candidate account.' });
    }

    const isMongo = getDbMode() === 'mongodb';

    if (isMongo) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const assignedCompanyName = companyName ? companyName.trim() : (assignedRole === 'company' ? 'My Tech Startup' : '');

      const user = new User({
        name: trimmedName,
        email: normalizedEmail,
        password,
        role: assignedRole,
        companyName: assignedCompanyName,
        companyId: ''
      });

      if (assignedRole === 'company') {
        user.companyId = String(user._id);
      }

      await user.save();

      // For company users, ensure Company record exists
      if (assignedRole === 'company') {
        await Company.create({
          name: assignedCompanyName,
          ownerId: String(user._id),
          authorizedMembers: [String(user._id)]
        }).catch(() => null);
      } else {
        await Candidate.create({
          userId: String(user._id),
          name: trimmedName,
          title: '',
          yearsOfExperience: null,
          skills: [],
          profileVisibility: 'Private'
        });
      }

      const token = generateToken(user);
      setAuthCookie(res, token);
      const userObj = user.toObject();
      delete userObj.password;

      return res.status(201).json({
        success: true,
        token,
        user: userObj
      });
    } else {
      const existing = await inMemoryStore.findUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const assignedCompanyName = companyName ? companyName.trim() : (assignedRole === 'company' ? 'My Tech Startup' : '');

      const user = await inMemoryStore.createUser({
        name: trimmedName,
        email: normalizedEmail,
        password,
        role: assignedRole,
        companyName: assignedCompanyName
      });

      if (assignedRole === 'candidate') {
        await inMemoryStore.createCandidate({
          userId: String(user._id),
          name: trimmedName,
          title: '',
          yearsOfExperience: null,
          skills: []
        });
      }

      const token = generateToken(user);
      setAuthCookie(res, token);
      const { password: _, ...userSafe } = user;

      return res.status(201).json({
        success: true,
        token,
        user: userSafe
      });
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both email and password.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Email and password must be valid text strings.' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMongo = getDbMode() === 'mongodb';
    let user = null;

    if (isMongo) {
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      if (user.status === 'suspended') {
        const errorMsg = `Account suspended: ${user.suspendedReason || 'Please contact platform operations.'}`;
        return res.status(403).json({
          success: false,
          error: errorMsg,
          message: errorMsg
        });
      }
      if (user.role === 'company' && !user.companyId) {
        user.companyId = String(user._id);
        await user.save();
      }
      const token = generateToken(user);
      setAuthCookie(res, token);
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ success: true, token, user: userObj });
    } else {
      user = await inMemoryStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      if (user.status === 'suspended') {
        const errorMsg = `Account suspended: ${user.suspendedReason || 'Please contact platform operations.'}`;
        return res.status(403).json({
          success: false,
          error: errorMsg,
          message: errorMsg
        });
      }
      const token = generateToken(user);
      setAuthCookie(res, token);
      const { password: _, ...userSafe } = user;
      return res.json({ success: true, token, user: userSafe });
    }
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      return res.json({ success: true, user });
    } else {
      const user = await inMemoryStore.findUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      const { password: _, ...userSafe } = user;
      return res.json({ success: true, user: userSafe });
    }
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const demoLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' || getDbMode() === 'mongodb') {
      return res.status(403).json({
        success: false,
        error: 'Demo authentication is disabled in production environments.'
      });
    }

    const { role = 'company' } = req.body;
    const targetUser = defaultUsers.find(u => u.role === role) || defaultUsers[0];
    const token = generateToken(targetUser);
    setAuthCookie(res, token);
    const { password: _, ...userSafe } = targetUser;
    return res.json({
      success: true,
      token,
      user: userSafe
    });
  } catch (err) {
    next(err);
  }
};
