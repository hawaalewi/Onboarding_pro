import express from 'express';
import { register, login } from '../controllers/authController.js';
import { forgotPassword, resetPassword } from '../controllers/authController.js';
import { getApplications, submitApplication } from '../controllers/applicationController.js';
import { getJobSeekerCalendar, discoverSessions, getSessionDetails } from '../controllers/sessionController.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes - Dashboard endpoints
router.get('/applications', authMiddleware, getApplications);
router.post('/applications', authMiddleware, submitApplication);
router.get('/jobseeker/calendar', authMiddleware, getJobSeekerCalendar);
router.get('/notifications', authMiddleware, getNotifications);
router.put('/notifications/:id/read', authMiddleware, markNotificationRead);

// Session discovery (optional auth - works for both authenticated and unauthenticated users)
router.get('/sessions/discover', authMiddleware, discoverSessions);
router.get('/sessions/:id', authMiddleware, getSessionDetails);

// Wishlist routes
router.get('/wishlist', authMiddleware, getWishlist);
router.post('/wishlist', authMiddleware, addToWishlist);
router.delete('/wishlist/:sessionId', authMiddleware, removeFromWishlist);

export default router;
