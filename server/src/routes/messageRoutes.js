import express from 'express';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { Message } from '../models/Message.js';
import { getDbMode } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/messages
router.get('/', protect, async (req, res, next) => {
  try {
    const { conversationId } = req.query;
    const userId = req.user.id;
    const effectiveCompanyId = req.user.companyId || req.user.id;
    const isMongo = getDbMode() === 'mongodb';

    if (isMongo) {
      const userClause = {
        $or: [
          { senderId: userId },
          { recipientId: userId },
          { companyId: effectiveCompanyId }
        ]
      };
      const query = conversationId
        ? { $and: [userClause, { conversationId }] }
        : userClause;

      const messages = await Message.find(query).sort({ createdAt: 1 });
      return res.json({ success: true, data: messages });
    } else {
      const messages = await inMemoryStore.findMessages(conversationId, userId);
      return res.json({ success: true, data: messages });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/messages
router.post('/', protect, async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role || 'company';
    const senderName = req.user.name || 'Member';
    const companyId = req.user.companyId || req.user.id;

    const {
      conversationId,
      recipientId,
      recipientName,
      content
    } = req.body;

    if (!conversationId || !recipientId || !content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'conversationId, recipientId, and message content are required.' });
    }

    const payload = {
      companyId,
      conversationId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      content: content.trim()
    };

    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const newMsg = await Message.create(payload);
      return res.status(201).json({ success: true, data: newMsg });
    } else {
      const newMsg = await inMemoryStore.createMessage(payload);
      return res.status(201).json({ success: true, data: newMsg });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
