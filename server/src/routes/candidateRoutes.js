import { Router } from 'express';
import { getAllCandidates, getCandidateById } from '../controllers/candidateController.js';

const router = Router();

router.get('/', getAllCandidates);
router.get('/:id', getCandidateById);

export default router;
