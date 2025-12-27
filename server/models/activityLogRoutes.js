import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getActivityLogs);

export default router;
