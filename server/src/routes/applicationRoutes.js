import { Router } from 'express';
import { authorize, protect } from '../middleware/authMiddleware.js';
import {
  getApplication,
  listApplications,
  submitApplication,
  updateApplicationStatus,
  withdrawApplication,
  addInternalNote
} from '../controllers/applicationController.js';

const router = Router();

router.get('/', protect, authorize('candidate', 'company', 'admin'), listApplications);
router.post('/', protect, authorize('candidate'), submitApplication);
router.get('/:id', protect, authorize('candidate', 'company', 'admin'), getApplication);
router.patch('/:id/status', protect, authorize('company', 'admin'), updateApplicationStatus);
router.post('/:id/withdraw', protect, authorize('candidate'), withdrawApplication);
router.post('/:id/notes', protect, authorize('company', 'admin'), addInternalNote);

export default router;
