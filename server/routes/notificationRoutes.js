import express from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllNotificationsRead);
router.put('/mark-all-read', markAllNotificationsRead); // Semantic alias

router.patch('/:id/read', validateObjectId(['id']), markNotificationRead);
router.put('/:id/read', validateObjectId(['id']), markNotificationRead); // Semantic alias

export default router;
