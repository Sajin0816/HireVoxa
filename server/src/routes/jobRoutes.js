import { Router } from 'express';
import { getAllJobs, getJobById, createJob, updateJob } from '../controllers/jobController.js';

const router = Router();

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', createJob);
router.patch('/:id', updateJob);

export default router;
