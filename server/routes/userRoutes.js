import express from 'express';
import { getProfile, updateProfile, getProfileDetails, saveProfile, getPublicProfile } from '../controllers/userController.js';
import { addSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import { addExperience, updateExperience, deleteExperience } from '../controllers/experienceController.js';
import { uploadProfilePhoto, uploadResume } from '../controllers/uploadController.js';
import { uploadProfilePhoto as uploadPhotoMiddleware, uploadResume as uploadResumeMiddleware } from '../middleware/uploadMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getProfileCompletion } from '../controllers/profileCompletionController.js';
import { getSocialLinks, updateSocialLinks } from '../controllers/socialLinksController.js';
import { getEducation, addEducation, updateEducation, deleteEducation } from '../controllers/educationController.js';
const router = express.Router();

// All routes are protected
// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile/details', authMiddleware, getProfileDetails);
router.post('/profile/save', authMiddleware, saveProfile);
router.get('/:id/public', getPublicProfile);
// profile completion route
router.get('/me/profile-completion', authMiddleware, getProfileCompletion);

// Upload routes (error handling is now in middleware)
router.post('/profile/photo', authMiddleware, uploadPhotoMiddleware, uploadProfilePhoto);
router.post('/resume', authMiddleware, uploadResumeMiddleware, uploadResume);

// Skills routes
router.post('/skills', authMiddleware, addSkill);
router.put('/skills/:id', authMiddleware, updateSkill);
router.delete('/skills/:id', authMiddleware, deleteSkill);

// Experience routes
router.post('/experience', authMiddleware, addExperience);
router.put('/experience/:id', authMiddleware, updateExperience);
router.delete('/experience/:id', authMiddleware, deleteExperience);


//Social Links
router.get('/me/social-links', authMiddleware, getSocialLinks);
router.put('/me/social-links', authMiddleware, updateSocialLinks);

// Education routes
router.get('/me/education', authMiddleware, getEducation);
router.post('/me/education', authMiddleware, addEducation);
router.put('/me/education/:id', authMiddleware, updateEducation);
router.delete('/me/education/:id', authMiddleware, deleteEducation);

export default router;

