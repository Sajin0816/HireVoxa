import express from 'express';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { Message } from '../models/Message.js';
import { getDbMode } from '../config/db.js';

const router = express.Router();

// GET /api/messages
router.get('/', async (req, res, next) => {
  try {
    const { conversationId } = req.query;
    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const query = conversationId ? { conversationId } : {};
      const messages = await Message.find(query).sort({ createdAt: 1 });
      return res.json({ success: true, data: messages });
    } else {
      const messages = await inMemoryStore.findMessages(conversationId);
      return res.json({ success: true, data: messages });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/messages
router.post('/', async (req, res, next) => {
  try {
    const {
      conversationId = 'conv-general',
      senderId = 'usr-company-001',
      senderName = 'Richard Feynman',
      senderRole = 'company',
      recipientId = 'cand-001',
      recipientName = 'Rodrigo Feynman Silva',
      content
    } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message content cannot be empty' });
    }

    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const newMsg = await Message.create({
        conversationId,
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        content: content.trim()
      });
      return res.status(201).json({ success: true, data: newMsg });
    } else {
      const newMsg = await inMemoryStore.createMessage({
        conversationId,
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        content: content.trim()
      });
      return res.status(201).json({ success: true, data: newMsg });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
