import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { inMemoryStore, defaultUsers } from '../services/inMemoryStore.js';
import { getDbMode } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirevoxa_jwt_secret_dev_2026';
const JWT_EXPIRES = '7d';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const isMongo = getDbMode() === 'mongodb';

    if (isMongo) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'company',
        companyName: companyName || (role === 'company' ? 'My Tech Startup' : '')
      });

      const token = generateToken(user);
      const userObj = user.toObject();
      delete userObj.password;

      return res.status(201).json({
        success: true,
        token,
        user: userObj
      });
    } else {
      const existing = await inMemoryStore.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const user = await inMemoryStore.createUser({
        name,
        email,
        password,
        role: role || 'company',
        companyName: companyName || (role === 'company' ? 'My Tech Startup' : '')
      });

      const token = generateToken(user);
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

    const isMongo = getDbMode() === 'mongodb';
    let user = null;

    if (isMongo) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const token = generateToken(user);
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ success: true, token, user: userObj });
    } else {
      user = await inMemoryStore.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const token = generateToken(user);
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

export const demoLogin = async (req, res, next) => {
  try {
    const { role = 'company' } = req.body;
    const targetUser = defaultUsers.find(u => u.role === role) || defaultUsers[0];
    const token = generateToken(targetUser);
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
