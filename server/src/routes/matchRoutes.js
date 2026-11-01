import { Router } from 'express';
import { getJobMatches, getTopRecommendations } from '../controllers/matchController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/recommendations', protect, authorize('company', 'admin'), getTopRecommendations);
router.get('/job/:jobId', protect, authorize('company', 'admin'), getJobMatches);

export default router;
