import express from 'express';
import {
  getOrganizationSessions,
  createSession,
  updateSession,
  deleteSession
} from '../controllers/sessionController.js';
import {
  getOrganizationApplications,
  updateApplicationStatus
} from '../controllers/applicationController.js';
import {
  createOrganization,
  updateOrganization,
  closeOrganization,
  getOrganizationPublicProfile,
  getOrganizationProfile
} from '../controllers/organizationController.js';
import { authMiddleware, organizationOnly } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/:id/public', validateObjectId(['id']), getOrganizationPublicProfile);

// All routes are protected and require organization account
// Organization management routes (Stage 5)
router.get('/', authMiddleware, organizationOnly, getOrganizationProfile);
router.post('/', authMiddleware, organizationOnly, createOrganization);
router.put('/', authMiddleware, organizationOnly, updateOrganization);
router.patch('/close', authMiddleware, organizationOnly, closeOrganization);

// Session management routes
router.get('/sessions', authMiddleware, organizationOnly, getOrganizationSessions);
router.post('/sessions', authMiddleware, organizationOnly, createSession);
router.put('/sessions/:id', authMiddleware, organizationOnly, validateObjectId(['id']), updateSession);
router.delete('/sessions/:id', authMiddleware, organizationOnly, deleteSession);

// Application management routes
router.get('/applications', authMiddleware, organizationOnly, getOrganizationApplications);
router.put('/applications/:id/status', authMiddleware, organizationOnly, validateObjectId(['id']), updateApplicationStatus);

export default router;

