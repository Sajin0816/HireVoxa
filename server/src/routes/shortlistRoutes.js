import express from 'express';
import { inMemoryStore } from '../services/inMemoryStore.js';
import { Shortlist } from '../models/Shortlist.js';
import { getDbMode } from '../config/db.js';

const router = express.Router();

// GET /api/shortlists
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId || 'usr-company-001';
    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const items = await Shortlist.find({ userId });
      return res.json({ success: true, data: items });
    } else {
      const items = await inMemoryStore.findShortlists(userId);
      return res.json({ success: true, data: items });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/shortlists/toggle
router.post('/toggle', async (req, res, next) => {
  try {
    const { userId = 'usr-company-001', candidateId, jobId, notes } = req.body;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const isMongo = getDbMode() === 'mongodb';
    if (isMongo) {
      const existing = await Shortlist.findOne({ userId, candidateId });
      if (existing) {
        await Shortlist.deleteOne({ _id: existing._id });
        return res.json({ success: true, shortlisted: false });
      } else {
        const item = await Shortlist.create({ userId, candidateId, jobId, notes });
        return res.json({ success: true, shortlisted: true, item });
      }
    } else {
      const result = await inMemoryStore.toggleShortlist(userId, candidateId, jobId, notes);
      return res.json({ success: true, ...result });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
