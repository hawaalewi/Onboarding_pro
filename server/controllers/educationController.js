import User from '../models/User.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';

// Helper to validate date
const isValidDate = (date) => {
  return !date || !isNaN(Date.parse(date));
};

// GET /api/users/me/education
export const getEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('personalInfo.education');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      data: user.personalInfo?.education || []
    });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ success: false, message: 'Error fetching education', error: error.message });
  }
};

// POST /api/users/me/education
export const addEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { school, degree, startDate, endDate, stillStudying, description } = req.body;

    const errors = [];

    if (!school || typeof school !== 'string') errors.push('School is required and must be a string.');
    if (!degree || typeof degree !== 'string') errors.push('Degree is required and must be a string.');
    if (startDate && !isValidDate(startDate)) errors.push('Start date must be a valid date.');
    if (endDate && !isValidDate(endDate)) errors.push('End date must be a valid date.');
    if (stillStudying !== undefined && typeof stillStudying !== 'boolean') errors.push('stillStudying must be boolean.');
    if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string.');

    if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation errors', errors });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.personalInfo) user.personalInfo = {};
    if (!Array.isArray(user.personalInfo.education)) user.personalInfo.education = [];

    const newEducation = {
      school: school.trim(),
      degree: degree.trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      stillStudying: stillStudying || false,
      description: description?.trim() || ''
    };

    user.personalInfo.education.push(newEducation);

    // Trigger profile completion recalculation
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    res.status(201).json({ success: true, message: 'Education added successfully', data: newEducation });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ success: false, message: 'Error adding education', error: error.message });
  }
};

// PUT /api/users/me/education/:id
export const updateEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const eduId = req.params.id;
    const { school, degree, startDate, endDate, stillStudying, description } = req.body;

    const errors = [];

    if (school !== undefined && typeof school !== 'string') errors.push('School must be a string.');
    if (degree !== undefined && typeof degree !== 'string') errors.push('Degree must be a string.');
    if (startDate !== undefined && !isValidDate(startDate)) errors.push('Start date must be a valid date.');
    if (endDate !== undefined && !isValidDate(endDate)) errors.push('End date must be a valid date.');
    if (stillStudying !== undefined && typeof stillStudying !== 'boolean') errors.push('stillStudying must be boolean.');
    if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string.');

    if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation errors', errors });

    const user = await User.findById(userId);
    if (!user || !user.personalInfo?.education) return res.status(404).json({ success: false, message: 'Education entry not found' });

    const eduIndex = user.personalInfo.education.findIndex(e => e._id.toString() === eduId);
    if (eduIndex === -1) return res.status(404).json({ success: false, message: 'Education entry not found' });

    if (school !== undefined) user.personalInfo.education[eduIndex].school = school.trim();
    if (degree !== undefined) user.personalInfo.education[eduIndex].degree = degree.trim();
    if (startDate !== undefined) user.personalInfo.education[eduIndex].startDate = new Date(startDate);
    if (endDate !== undefined) user.personalInfo.education[eduIndex].endDate = new Date(endDate);
    if (stillStudying !== undefined) user.personalInfo.education[eduIndex].stillStudying = stillStudying;
    if (description !== undefined) user.personalInfo.education[eduIndex].description = description.trim();

    // Trigger profile completion recalculation
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    res.status(200).json({ success: true, message: 'Education updated successfully', data: user.personalInfo.education[eduIndex] });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ success: false, message: 'Error updating education', error: error.message });
  }
};

// DELETE /api/users/me/education/:id
export const deleteEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const eduId = req.params.id;

    const user = await User.findById(userId);
    if (!user || !user.personalInfo?.education) return res.status(404).json({ success: false, message: 'Education entry not found' });

    const eduIndex = user.personalInfo.education.findIndex(e => e._id.toString() === eduId);
    if (eduIndex === -1) return res.status(404).json({ success: false, message: 'Education entry not found' });

    const deletedEdu = user.personalInfo.education.splice(eduIndex, 1);

    // Trigger profile completion recalculation
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    res.status(200).json({ success: true, message: 'Education deleted successfully', data: deletedEdu[0] });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ success: false, message: 'Error deleting education', error: error.message });
  }
};
