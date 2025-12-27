import express from 'express';
import { getCalendarSessions } from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/sessions/calendar
router.get('/calendar', authMiddleware, getCalendarSessions);

export default router;
