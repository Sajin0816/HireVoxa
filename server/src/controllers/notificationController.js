import { getDbMode } from '../config/db.js';
import { Notification } from '../models/Notification.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

export async function createNotificationEvent({ recipientUserId, recipientRole, companyId, type, title, message, link }) {
  const payload = {
    recipientUserId,
    recipientRole,
    companyId: companyId || null,
    type,
    title,
    message,
    link: link || '',
    read: false,
    createdAt: new Date()
  };

  if (getDbMode() === 'in-memory-demo') {
    return inMemoryStore.createNotification(payload);
  }
  return Notification.create(payload);
}

export async function getNotifications(req, res, next) {
  try {
    const mode = getDbMode();
    const userId = req.user.id;
    const isCompany = req.user.role === 'company' || req.user.role === 'admin';
    const companyId = isCompany ? (req.user.companyId || req.user.id) : null;

    let notifications = [];
    if (mode === 'in-memory-demo') {
      notifications = await inMemoryStore.findNotifications({ recipientUserId: userId, companyId });
    } else {
      const query = {
        $or: [
          { recipientUserId: userId },
          ...(companyId ? [{ companyId }] : [])
        ]
      };
      notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      mode,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const mode = getDbMode();
    const userId = req.user.id;

    if (mode === 'in-memory-demo') {
      const updated = await inMemoryStore.markNotificationRead(id, userId);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Notification not found or access denied.' });
      }
      return res.json({ success: true, message: 'Notification marked as read.', data: updated });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    const companyId = req.user.companyId || req.user.id;
    const hasAccess = notification.recipientUserId === userId || (notification.companyId && notification.companyId === companyId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied: Notification belongs to another user.' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.', data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const mode = getDbMode();
    const userId = req.user.id;
    const companyId = req.user.companyId || (req.user.role === 'company' ? req.user.id : null);

    if (mode === 'in-memory-demo') {
      await inMemoryStore.markAllNotificationsRead(userId, companyId);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    await Notification.updateMany(
      {
        $or: [
          { recipientUserId: userId },
          ...(companyId ? [{ companyId }] : [])
        ],
        read: false
      },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}
