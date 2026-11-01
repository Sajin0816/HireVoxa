import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { getAllCandidates, getCandidateById } from '../controllers/candidateController.js';
import {
  deleteMyResume,
  downloadResume,
  getMyProfile,
  getMyResume,
  updateMyProfile,
  uploadMyResume
} from '../controllers/candidatePortalController.js';
import { authorize, optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});
const resumeUpload = (req, res, next) => upload.single('resume')(req, res, (error) => {
  if (error) {
    error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return next(error);
  }
  next();
});
const resumeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many resume uploads. Please try again later.' }
});

router.get('/me', protect, authorize('candidate'), getMyProfile);
router.patch('/me', protect, authorize('candidate'), updateMyProfile);
router.get('/me/profile', protect, authorize('candidate'), getMyProfile);
router.patch('/me/profile', protect, authorize('candidate'), updateMyProfile);
router.get('/me/resume', protect, authorize('candidate'), getMyResume);
router.post('/me/resume', protect, authorize('candidate'), resumeRateLimit, resumeUpload, uploadMyResume);
router.get('/me/resume/:id', protect, authorize('candidate'), downloadResume);
router.delete('/me/resume', protect, authorize('candidate'), deleteMyResume);
router.delete('/me/resume/:id', protect, authorize('candidate'), deleteMyResume);
router.get('/resume/:id', protect, authorize('candidate', 'company', 'admin'), downloadResume);

router.get('/', optionalAuth, getAllCandidates);
router.get('/:id', optionalAuth, getCandidateById);

export default router;
