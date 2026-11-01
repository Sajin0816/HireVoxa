import { Router } from 'express';
import { getAllJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController.js';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';
import { checkJobPostingLimit } from '../middleware/entitlementMiddleware.js';
import { submitApplication } from '../controllers/applicationController.js';

const router = Router();

router.get('/', optionalAuth, getAllJobs);
router.get('/:id', optionalAuth, getJobById);
router.post('/', protect, authorize('company', 'admin'), checkJobPostingLimit, createJob);
router.patch('/:id', protect, authorize('company', 'admin'), updateJob);
router.delete('/:id', protect, authorize('company', 'admin'), deleteJob);
router.post('/:jobId/applications', protect, authorize('candidate'), submitApplication);
router.post('/:jobId/apply', protect, authorize('candidate'), submitApplication);

export default router;
