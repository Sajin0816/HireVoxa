import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { getDbMode } from '../config/db.js';

/**
 * Ensures user has an active admin role.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = 'Access denied: platform administration privileges required.';
    return res.status(403).json({ success: false, error, message: error });
  }

  if (req.user.status === 'suspended') {
    const error = 'Admin account is suspended. Access revoked.';
    return res.status(403).json({ success: false, error, message: error });
  }

  next();
};

export const requireAdminRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      const error = 'Access denied: platform administration privileges required.';
      return res.status(403).json({ success: false, error, message: error });
    }

    const currentAdminRole = req.user.adminRole || 'owner';
    if (!allowedRoles.includes(currentAdminRole)) {
      const error = `Access denied: action requires [${allowedRoles.join(' or ')}] administrative permissions.`;
      return res.status(403).json({ success: false, error, message: error });
    }

    next();
  };
};

export const requireAdminWrite = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = 'Access denied: platform administration privileges required.';
    return res.status(403).json({ success: false, error, message: error });
  }

  const currentAdminRole = req.user.adminRole || 'owner';
  if (currentAdminRole === 'analyst') {
    const error = 'Access denied: Read-only Analysts cannot perform state-mutating operations.';
    return res.status(403).json({ success: false, error, message: error });
  }

  next();
};

/**
 * Append-only audit logger for administrative actions.
 * Safely strips secrets, passwords, and tokens.
 */
export const logAdminAction = async ({
  req,
  action,
  targetType,
  targetId = '',
  outcome = 'success',
  reason = '',
  details = {}
}) => {
  try {
    const actorId = req?.user?.id || 'system';
    const actorEmail = req?.user?.email || 'system@hirevoxa.internal';
    const actorRole = req?.user?.adminRole || req?.user?.role || 'system';

    // Deep sanitize details object: remove passwords, tokens, cookies
    const cleanDetails = { ...details };
    delete cleanDetails.password;
    delete cleanDetails.token;
    delete cleanDetails.authorization;
    delete cleanDetails.cookie;

    const logEntry = {
      actorId: String(actorId),
      actorEmail: String(actorEmail),
      actorRole: String(actorRole),
      action: String(action),
      targetType: String(targetType),
      targetId: String(targetId),
      outcome: String(outcome),
      reason: String(reason || ''),
      details: cleanDetails,
      ipAddress: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'internal',
      timestamp: new Date()
    };

    const mode = getDbMode();
    if (mode === 'mongodb') {
      await AuditLog.create(logEntry);
    } else {
      await inMemoryStore.createAuditLog(logEntry);
    }
  } catch (err) {
    console.error('[Admin Audit Log Error] Failed to write audit event:', err.message);
  }
};
