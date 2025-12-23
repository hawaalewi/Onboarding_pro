import User from '../models/User.js';

// POST /api/user/experience - Add a new experience entry
export const addExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, startDate, endDate, description, isCurrent } = req.body;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Validation
    const errors = [];
    if (!company || typeof company !== 'string' || company.trim().length === 0) {
      errors.push('Company name is required');
    }
    if (!startDate) {
      errors.push('Start date is required');
    }
    if (!isCurrent && !endDate) {
      errors.push('End date is required if not current position');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    const start = new Date(startDate);
    const end = isCurrent ? null : new Date(endDate);

    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    if (!isCurrent && (isNaN(end.getTime()) || end < start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date. End date must be after start date.'
      });
    }

    // Initialize personalInfo if needed and ensure arrays are properly initialized
    if (!user.personalInfo) {
      user.personalInfo = { experience: [], skills: [] };
    }
    // Ensure experience is always an array (handle legacy string data)
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }
    // Ensure skills is always an array
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }

    // Add experience entry
    const newExperience = {
      company: company.trim(),
      startDate: start,
      endDate: isCurrent ? null : end,
      description: description ? description.trim() : '',
      isCurrent: isCurrent || false
    };

    user.personalInfo.experience.push(newExperience);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        experience: user.personalInfo.experience
      },
      message: 'Experience added successfully'
    });
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding experience',
      error: error.message
    });
  }
};

// PUT /api/user/experience/:id - Update an experience entry
export const updateExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { company, startDate, endDate, description, isCurrent } = req.body;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Initialize personalInfo if needed
    if (!user.personalInfo) {
      user.personalInfo = { experience: [], skills: [] };
    }
    // Ensure experience is always an array (handle legacy string data)
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }
    // Ensure skills is always an array
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }

    if (user.personalInfo.experience.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found'
      });
    }

    const expIndex = parseInt(id);
    if (isNaN(expIndex) || expIndex < 0 || expIndex >= user.personalInfo.experience.length) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found'
      });
    }

    // Validation
    const errors = [];
    if (company !== undefined && (!company || typeof company !== 'string' || company.trim().length === 0)) {
      errors.push('Company name is required');
    }
    if (startDate !== undefined && !startDate) {
      errors.push('Start date is required');
    }
    if (isCurrent === false && !endDate) {
      errors.push('End date is required if not current position');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    const start = startDate ? new Date(startDate) : user.personalInfo.experience[expIndex].startDate;
    const end = isCurrent ? null : (endDate ? new Date(endDate) : user.personalInfo.experience[expIndex].endDate);

    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    if (!isCurrent && end && (isNaN(end.getTime()) || end < start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date. End date must be after start date.'
      });
    }

    // Ensure the experience entry is an object, not a string
    if (typeof user.personalInfo.experience[expIndex] === 'string') {
      user.personalInfo.experience[expIndex] = {
        company: '',
        startDate: new Date(),
        endDate: null,
        description: '',
        isCurrent: false
      };
    }

    // Update experience entry
    if (company !== undefined) user.personalInfo.experience[expIndex].company = company.trim();
    if (startDate !== undefined) user.personalInfo.experience[expIndex].startDate = start;
    if (endDate !== undefined || isCurrent !== undefined) {
      user.personalInfo.experience[expIndex].endDate = isCurrent ? null : end;
      user.personalInfo.experience[expIndex].isCurrent = isCurrent || false;
    }
    if (description !== undefined) user.personalInfo.experience[expIndex].description = description.trim();

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        experience: user.personalInfo.experience
      },
      message: 'Experience updated successfully'
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating experience',
      error: error.message
    });
  }
};

// DELETE /api/user/experience/:id - Delete an experience entry
export const deleteExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Initialize personalInfo if needed
    if (!user.personalInfo) {
      user.personalInfo = { experience: [], skills: [] };
    }
    // Ensure experience is always an array (handle legacy string data)
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }
    // Ensure skills is always an array
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }

    if (user.personalInfo.experience.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found'
      });
    }

    const expIndex = parseInt(id);
    if (isNaN(expIndex) || expIndex < 0 || expIndex >= user.personalInfo.experience.length) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found'
      });
    }

    // Delete experience entry
    user.personalInfo.experience.splice(expIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        experience: user.personalInfo.experience
      },
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting experience',
      error: error.message
    });
  }
};

