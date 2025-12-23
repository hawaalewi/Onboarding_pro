import express from 'express';
import { exportApplicants } from '../controllers/exportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/session/:sessionId/applicants', authMiddleware, exportApplicants);

export default router;
