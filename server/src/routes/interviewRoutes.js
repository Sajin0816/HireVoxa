import { Router } from 'express';
import { getAllInterviews, createInterview } from '../controllers/interviewController.js';

const router = Router();

router.get('/', getAllInterviews);
router.post('/', createInterview);

export default router;
