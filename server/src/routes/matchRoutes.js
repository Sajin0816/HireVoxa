import { Router } from 'express';
import { getJobMatches, getTopRecommendations } from '../controllers/matchController.js';

const router = Router();

router.get('/recommendations', getTopRecommendations);
router.get('/job/:jobId', getJobMatches);

export default router;
