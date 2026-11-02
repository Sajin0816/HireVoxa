import jwt from 'jsonwebtoken';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { getDbMode } from '../config/db.js';

import { getJwtSecret } from '../config/jwt.js';

export { getJwtSecret };

export const protect = async (req, res, next) => {
  let token = null;
  let isCookieAuth = false;

  // 1. Check Authorization Bearer header first (API/mobile/test clients)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HttpOnly session cookie (browser clients)
  else if (req.cookies && req.cookies.hirevoxa_token) {
    token = req.cookies.hirevoxa_token;
    isCookieAuth = true;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Please log in.'
    });
  }

  // 3. CSRF Protection for state-changing Cookie requests
  const mutationMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
  if (isCookieAuth && mutationMethods.includes(req.method)) {
    const customHeader = req.headers['x-requested-with'] || req.headers['x-hirevoxa-csrf'];
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [
      process.env.CLIENT_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ].filter(Boolean);

    const isOriginAllowed = origin && (
      allowedOrigins.some(o => origin.startsWith(o)) ||
      origin.includes('.vercel.app') ||
      origin.includes('hirevoxa.com')
    );

    if (!customHeader && !isOriginAllowed && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'CSRF protection: missing required anti-CSRF request header or origin verification.'
      });
    }
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Access denied.',
        message: 'Account suspended. Access denied.'
      });
    }

    // Live status revocation: if account was suspended after token issuance
    if (getDbMode() === 'mongodb') {
      const { User } = await import('../models/User.js');
      const liveUser = await User.findById(decoded.id).select('status').lean();
      if (!liveUser || liveUser.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Account suspended. Access denied.',
          message: 'Account suspended. Access denied.'
        });
      }
    } else {
      const liveUser = inMemoryStore.users?.find(u => u._id === decoded.id || u.id === decoded.id);
      if (liveUser && liveUser.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Account suspended. Access denied.',
          message: 'Account suspended. Access denied.'
        });
      }
    }
    req.user = decoded;
    // Normalize effective tenant companyId
    req.user.companyId = decoded.companyId || (decoded.role === 'company' ? decoded.id : undefined);
    req.user.adminRole = decoded.adminRole;
    req.user.status = decoded.status || 'active';
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or token invalid. Please log in again.'
    });
  }
};

export const optionalAuth = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.hirevoxa_token) {
    token = req.cookies.hirevoxa_token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    req.user.companyId = decoded.companyId || (decoded.role === 'company' ? decoded.id : undefined);
  } catch {
    // Silently continue for optional auth on public routes
  }
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user?.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

export const requireTenant = (req, res, next) => {
  if (!req.user || !req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: operation requires valid company tenant membership.'
    });
  }
  next();
};
