import { Router } from 'express';
import { getAllInterviews, createInterview, updateInterview, deleteInterview } from '../controllers/interviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getAllInterviews);
router.post('/', protect, authorize('company', 'admin'), createInterview);
router.patch('/:id', protect, authorize('company', 'candidate', 'admin'), updateInterview);
router.delete('/:id', protect, authorize('company', 'admin'), deleteInterview);

export default router;
